/**
 * End-to-end check of the review flow:
 *
 *   customer submits a review on the storefront
 *     -> the admin panel sees it as "waiting for approval"
 *     -> the admin approves it
 *     -> it shows up on the storefront
 *
 * It boots the real backend against a throwaway database, so the database,
 * the routes and the auth middleware are all exercised for real.
 *
 * By default it uses a temporary SQLite database. Set TEST_DATABASE_URL to run
 * the same flow against PostgreSQL, which is what production uses:
 *
 *   node test-review-approval-flow.js
 *   TEST_DATABASE_URL=postgres://user:pass@localhost:5432/review_flow_test \
 *     node test-review-approval-flow.js
 *
 * In PostgreSQL mode it also checks the upgrade path: a database that was
 * created before the review workflow existed gets its columns added and its
 * old rows backfilled without losing their state.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = __dirname;
const BACKEND = path.join(ROOT, 'backend');
const DB_PATH = path.join(BACKEND, 'database', '.review-flow-test.db');
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || null;
const USE_POSTGRES = Boolean(TEST_DATABASE_URL);
const PORT = 5099;
const BASE = `http://127.0.0.1:${PORT}/api`;
const JWT_SECRET = 'review-flow-test-secret';

const ADMIN_EMAIL = 'admin@review-flow.test';
const CUSTOMER_EMAIL = 'customer@review-flow.test';
const PASSWORD = 'TestPass123!';

let passed = 0;
let failed = 0;

function check(label, condition, detail) {
  if (condition) {
    passed += 1;
    console.log(`✅ ${label}`);
  } else {
    failed += 1;
    console.log(`❌ ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForServer(timeoutMs = 40000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${BASE}/health`);
      if (response.ok) return true;
    } catch (error) {
      // Not up yet.
    }
    await wait(300);
  }

  return false;
}

async function api(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  let body = null;
  try {
    body = await response.json();
  } catch (error) {
    body = null;
  }

  return { status: response.status, body };
}

/** Start the backend and wait until it answers. */
async function startServer() {
  const env = { ...process.env, PORT: String(PORT), JWT_SECRET };
  delete env.DATABASE_URL;

  if (USE_POSTGRES) {
    env.DATABASE_URL = TEST_DATABASE_URL;
  } else {
    env.DB_PATH = DB_PATH;
  }

  const server = spawn('node', ['server.js'], {
    cwd: BACKEND,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const log = [];
  server.stdout.on('data', (chunk) => log.push(chunk.toString()));
  server.stderr.on('data', (chunk) => log.push(chunk.toString()));
  server.log = log;

  if (!(await waitForServer())) {
    throw new Error(`Backend did not start:\n${log.join('')}`);
  }

  return server;
}

async function stopServer(server) {
  if (!server) return;
  server.kill('SIGTERM');
  await wait(500);
}

/** Create the admin and the customer once the schema exists. */
async function createUsers() {
  const bcrypt = require(path.join(BACKEND, 'node_modules', 'bcryptjs'));
  const hash = bcrypt.hashSync(PASSWORD, 10);

  if (USE_POSTGRES) {
    const { Pool } = require(path.join(BACKEND, 'node_modules', 'pg'));
    const pool = new Pool({ connectionString: TEST_DATABASE_URL, max: 2 });

    // The backend seeds the default company in the background.
    for (let i = 0; i < 60; i += 1) {
      const company = await pool.query('SELECT id FROM companies WHERE id = 1');
      if (company.rows.length) break;
      await wait(500);
    }

    await pool.query(
      `INSERT INTO users (email, name, password, role, company_id, admin_company_id)
       VALUES ($1, $2, $3, 'ADMIN', 1, 1)
       ON CONFLICT (email) DO NOTHING`,
      [ADMIN_EMAIL, 'Store Admin', hash]
    );
    await pool.query(
      `INSERT INTO users (email, name, password, role, company_id, admin_company_id)
       VALUES ($1, $2, $3, 'USER', 1, NULL)
       ON CONFLICT (email) DO NOTHING`,
      [CUSTOMER_EMAIL, 'Holly Mery', hash]
    );

    await pool.end();
    return;
  }

  const Database = require(path.join(BACKEND, 'node_modules', 'better-sqlite3'));
  const database = new Database(DB_PATH);

  for (let i = 0; i < 60; i += 1) {
    const company = database.prepare('SELECT id FROM companies WHERE id = 1').get();
    if (company) break;
    await wait(250);
  }

  const insertUser = database.prepare(`
    INSERT INTO users (email, name, password, role, company_id, admin_company_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertUser.run(ADMIN_EMAIL, 'Store Admin', hash, 'ADMIN', 1, 1);
  insertUser.run(CUSTOMER_EMAIL, 'Holly Mery', hash, 'USER', 1, null);
  database.close();
}

/** The review flow itself. */
async function runFlow() {
  const adminLogin = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: ADMIN_EMAIL, password: PASSWORD }),
  });
  check('admin can log in', adminLogin.status === 200, JSON.stringify(adminLogin.body));
  const adminToken = adminLogin.body?.token;

  const customerLogin = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: CUSTOMER_EMAIL, password: PASSWORD }),
  });
  check('customer can log in', customerLogin.status === 200, JSON.stringify(customerLogin.body));
  const customerToken = customerLogin.body?.token;

  const adminHeaders = { Authorization: `Bearer ${adminToken}` };

  // --- A guest submits a review ----------------------------------------
  const guestSubmit = await api('/testimonials/customer-submit', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Amira B.',
      title: 'Best vintage find',
      message: 'The dress was even better than the photos.',
      companyId: 1,
    }),
  });
  check('guest review is accepted', guestSubmit.status === 201, JSON.stringify(guestSubmit.body));
  check('submitted review is pending', guestSubmit.body?.status === 'pending');
  const guestReviewId = guestSubmit.body?.id;

  // --- A signed-in customer submits a review ---------------------------
  const memberSubmit = await api('/testimonials/customer-submit', {
    method: 'POST',
    headers: { Authorization: `Bearer ${customerToken}` },
    body: JSON.stringify({
      name: 'Holly Mery',
      message: 'Loved the jacket and the whole experience.',
      companyId: 1,
    }),
  });
  check('member review is accepted', memberSubmit.status === 201, JSON.stringify(memberSubmit.body));
  const memberReviewId = memberSubmit.body?.id;

  // --- The pending reviews are not public ------------------------------
  const activeBefore = await api('/testimonials/active?companyId=1');
  const activeBeforeIds = (activeBefore.body?.testimonials || []).map((t) => t.id);
  check(
    'pending reviews are not on the storefront',
    !activeBeforeIds.includes(guestReviewId) && !activeBeforeIds.includes(memberReviewId),
    JSON.stringify(activeBefore.body)
  );

  // --- The full list is admin-only -------------------------------------
  const anonymousList = await api('/testimonials');
  check('the review list needs an admin token', anonymousList.status === 401);

  const adminList = await api('/testimonials', { headers: adminHeaders });
  check('admin list loads', adminList.status === 200, JSON.stringify(adminList.body));

  const list = adminList.body?.testimonials || [];
  const guestRow = list.find((t) => t.id === guestReviewId);
  const memberRow = list.find((t) => t.id === memberReviewId);

  check('submitted review reaches the admin queue', Boolean(guestRow));
  check('submitted review is pending in the admin queue', guestRow?.status === 'pending');
  check('submitted review is not live yet', guestRow?.is_active === false);
  check('submitted review is marked as a customer submission', guestRow?.source === 'customer');
  check(
    'signed-in review is linked to the customer account',
    memberRow?.user_id !== null && memberRow?.user_id !== undefined,
    JSON.stringify({ user_id: memberRow?.user_id })
  );
  check(
    'signed-in review carries the customer email',
    memberRow?.submitter_email === CUSTOMER_EMAIL,
    JSON.stringify({ submitter_email: memberRow?.submitter_email })
  );

  // --- Approve -> live on the storefront -------------------------------
  const approve = await api(`/testimonials/${guestReviewId}/approve`, {
    method: 'PATCH',
    headers: adminHeaders,
  });
  check('admin can approve a review', approve.status === 200, JSON.stringify(approve.body));
  check('approved review is live', approve.body?.testimonial?.is_active === true);
  check('approved review has the approved status', approve.body?.testimonial?.status === 'approved');

  const activeAfter = await api('/testimonials/active?companyId=1');
  const activeAfterIds = (activeAfter.body?.testimonials || []).map((t) => t.id);
  check('approved review shows on the storefront', activeAfterIds.includes(guestReviewId));
  check('the other review is still waiting', !activeAfterIds.includes(memberReviewId));

  // --- Editing a live review must not unpublish it ---------------------
  const edit = await api(`/testimonials/${guestReviewId}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({
      title: 'Best vintage find (edited)',
      name: 'Amira B.',
      description: 'The dress was even better than the photos.',
    }),
  });
  check('admin can edit a review', edit.status === 200, JSON.stringify(edit.body));
  check('editing keeps the review live', edit.body?.testimonial?.is_active === true);

  // --- Reject -> back off the storefront -------------------------------
  const reject = await api(`/testimonials/${memberReviewId}/reject`, {
    method: 'PATCH',
    headers: adminHeaders,
  });
  check('admin can reject a review', reject.status === 200, JSON.stringify(reject.body));
  check('rejected review is not live', reject.body?.testimonial?.is_active === false);
  check('rejected review has the rejected status', reject.body?.testimonial?.status === 'rejected');

  const activeFinal = await api('/testimonials/active?companyId=1');
  const activeFinalIds = (activeFinal.body?.testimonials || []).map((t) => t.id);
  check('rejected review is off the storefront', !activeFinalIds.includes(memberReviewId));

  // --- A rejected review can be published again -------------------------
  const toggle = await api(`/testimonials/${memberReviewId}/toggle`, {
    method: 'PATCH',
    headers: adminHeaders,
  });
  check('admin can publish a rejected review', toggle.body?.testimonial?.is_active === true);
  check('published review has the approved status', toggle.body?.testimonial?.status === 'approved');

  // --- The pending queue is empty of the handled reviews ---------------
  const finalList = await api('/testimonials', { headers: adminHeaders });
  const stillPending = (finalList.body?.testimonials || []).filter(
    (t) => t.status === 'pending' && [guestReviewId, memberReviewId].includes(t.id)
  );
  check('handled reviews leave the pending queue', stillPending.length === 0);
}

/**
 * The upgrade path: a database created before the workflow existed has no
 * status/source columns. Starting the backend has to add them and backfill
 * the old rows without changing what the admin had already decided.
 */
async function runUpgradeCheck(runningServer) {
  // Take one review off the storefront first, so the backfill has both a live
  // row and an unpublished row to work with.
  const adminLogin = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: ADMIN_EMAIL, password: PASSWORD }),
  });
  const adminHeaders = { Authorization: `Bearer ${adminLogin.body?.token}` };
  const before = await api('/testimonials', { headers: adminHeaders });
  const unpublished = (before.body?.testimonials || [])[0];
  if (unpublished) {
    await api(`/testimonials/${unpublished.id}/reject`, {
      method: 'PATCH',
      headers: adminHeaders,
    });
  }

  // The old database has to be back in its old shape before the backend
  // starts again.
  await stopServer(runningServer);

  const { Pool } = require(path.join(BACKEND, 'node_modules', 'pg'));
  const pool = new Pool({ connectionString: TEST_DATABASE_URL, max: 2 });

  await pool.query('ALTER TABLE testimonials DROP COLUMN IF EXISTS status');
  await pool.query('ALTER TABLE testimonials DROP COLUMN IF EXISTS source');
  await pool.query('ALTER TABLE testimonials DROP COLUMN IF EXISTS user_id');
  await pool.query('ALTER TABLE testimonials DROP COLUMN IF EXISTS submitter_email');
  await pool.end();

  const server = await startServer();
  try {
    const { Pool: Pool2 } = require(path.join(BACKEND, 'node_modules', 'pg'));
    const pool2 = new Pool2({ connectionString: TEST_DATABASE_URL, max: 2 });

    const columns = await pool2.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'testimonials' AND column_name IN ('status','source','user_id','submitter_email')`
    );
    check(
      'the workflow columns are added on startup',
      columns.rows.length === 4,
      JSON.stringify(columns.rows.map((r) => r.column_name))
    );

    const rows = await pool2.query(
      'SELECT id, is_active, status, source FROM testimonials ORDER BY id'
    );
    const live = rows.rows.find((r) => r.is_active === true);
    const notLive = rows.rows.find((r) => r.is_active === false);

    check('a live old review is backfilled as approved', live?.status === 'approved', JSON.stringify(live));
    check('old reviews are marked as admin written', rows.rows.every((r) => r.source === 'admin'));
    check(
      'an unpublished old review goes back to the approval queue',
      notLive?.status === 'pending',
      JSON.stringify(notLive)
    );
    check('an unpublished old review is still not live', notLive?.is_active === false);

    // The storefront still answers after the upgrade.
    const active = await api('/testimonials/active?companyId=1');
    check('the storefront still serves reviews after the upgrade', active.status === 200);

    await pool2.end();
  } finally {
    await stopServer(server);
  }
}

async function main() {
  if (!USE_POSTGRES && fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);

  let server = null;

  try {
    server = await startServer();
    await createUsers();
    await runFlow();

    if (USE_POSTGRES) {
      console.log('\n— upgrade check (database created before the workflow) —');
      await runUpgradeCheck(server);
      server = null;
    }

    await stopServer(server);
    server = null;
  } catch (error) {
    failed += 1;
    console.error('❌ Test run failed:', error);
    if (server?.log) console.error(server.log.join('').slice(-3000));
  } finally {
    await stopServer(server);

    if (!USE_POSTGRES && fs.existsSync(DB_PATH)) {
      fs.unlinkSync(DB_PATH);
      for (const suffix of ['-wal', '-shm']) {
        const sidecar = `${DB_PATH}${suffix}`;
        if (fs.existsSync(sidecar)) fs.unlinkSync(sidecar);
      }
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
