/**
 * Checks the review submission against a database that does not have the
 * optional photo column.
 *
 * The prod database skipped that migration, so the endpoint answered every
 * submission with a 500. A review without a picture — and a review with one
 * on a database that cannot store it — must both be accepted.
 */
process.env.DB_PATH = '/tmp/mavis-photo-test.db';
process.env.JWT_SECRET = 'test-secret';

const express = require('express');
const db = require('/Users/macmini/Desktop/thriftShop/backend/database/db');

const MISSING_COLUMN = {
  code: '42703',
  message: 'column "review_image" of relation "testimonials" does not exist',
};

let calls = [];
let columnMissing = false;

db.run = async (sql, params = []) => {
  // Only the review inserts are counted: the database seeds itself in the
  // background while this script starts up.
  if (!sql.includes('INSERT INTO testimonials')) return { id: 1, changes: 1 };

  const hasPhoto = sql.includes('review_image');
  calls.push({ hasPhoto, params });
  if (hasPhoto && columnMissing) {
    const error = new Error(MISSING_COLUMN.message);
    error.code = MISSING_COLUMN.code;
    throw error;
  }
  return { id: 42, changes: 1 };
};

const app = express();
app.use(express.json());
app.use('/api/testimonials', require('/Users/macmini/Desktop/thriftShop/backend/routes/testimonials'));

const server = app.listen(5098);

async function submit(body) {
  const response = await fetch('http://localhost:5098/api/testimonials/customer-submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

const base = {
  name: 'Hollymery',
  email: 'hollymery@example.com',
  title: 'Great find',
  message: 'The jacket was exactly as described and it fits beautifully.',
  companyId: 1,
  rating: 5,
};

const onePixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

(async () => {
  let failures = 0;
  const check = (label, condition, detail = '') => {
    console.log(`${condition ? '✅' : '❌'} ${label}${detail ? ' — ' + detail : ''}`);
    if (!condition) failures += 1;
  };

  // 1. The database has the column and the review carries a picture.
  columnMissing = false;
  calls = [];
  let result = await submit({ ...base, image: onePixel });
  check('column present, photo attached → 201', result.status === 201, `got ${result.status}`);
  check('the photo was stored', result.body.hasImage === true);
  check('one insert, with the photo column', calls.length === 1 && calls[0].hasPhoto);

  // 2. The database has the column and the review carries no picture.
  calls = [];
  result = await submit(base);
  check('column present, no photo → 201', result.status === 201, `got ${result.status}`);
  check('no photo reported', result.body.hasImage === false);
  check('one insert, without the photo column', calls.length === 1 && !calls[0].hasPhoto);

  // 3. The database is missing the column and the review carries no picture.
  columnMissing = true;
  calls = [];
  result = await submit(base);
  check('column missing, no photo → 201', result.status === 201, `got ${result.status}`);
  check('one insert, without the photo column', calls.length === 1 && !calls[0].hasPhoto);

  // 4. The database is missing the column and the review carries a picture.
  calls = [];
  result = await submit({ ...base, image: onePixel });
  check('column missing, photo attached → 201', result.status === 201, `got ${result.status}`);
  check('the review was kept, the photo dropped', result.body.hasImage === false);
  check('it retried without the photo column', calls.length === 2 && calls[0].hasPhoto && !calls[1].hasPhoto);

  // 5. A different failure is still an error.
  db.run = async () => {
    const error = new Error('connection terminated unexpectedly');
    throw error;
  };
  result = await submit(base);
  check('a real database failure → 500', result.status === 500, `got ${result.status}`);

  server.close();
  console.log(failures === 0 ? '\n✅ All review submission checks passed.' : `\n❌ ${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
})();
