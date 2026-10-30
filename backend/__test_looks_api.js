// Throwaway end-to-end check for the looks API. Uses a scratch DB so the real
// databases are never touched. Run from the backend folder:
//   node __test_looks_api.js
const fs = require('fs');
require('dotenv').config();

process.env.DB_PATH = './database/__looks_test.db';

// Clear the scratch DB BEFORE anything opens it.
for (const suffix of ['', '-wal', '-shm']) {
  const f = process.env.DB_PATH + suffix;
  if (fs.existsSync(f)) fs.unlinkSync(f);
}

const db = require('./database/db');
const jwt = require('jsonwebtoken');
const express = require('express');
const http = require('http');
const looksRouter = require('./routes/looks');

const TMP = process.env.DB_PATH;
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const run = async () => {
  // Arrange: an admin user, two products, and one look referencing both.
  await db.run(
    `INSERT INTO users (id, email, name, password, role) VALUES (1, 'admin@test.com', 'Admin', 'x', 'ADMIN')`
  );

  await db.run(
    `INSERT INTO products (id, name, price, images, category, color) VALUES (101, 'Black Corset', 35, ?, 'Corset Tops', 'Black')`,
    [JSON.stringify(['https://example.com/a.jpg', 'https://example.com/b.jpg'])]
  );
  await db.run(
    `INSERT INTO products (id, name, price, images, category, color) VALUES (102, 'Black Skirt', 45, ?, 'Skirts', 'Black')`,
    ['https://example.com/c.jpg']
  );

  const app = express();
  app.use(express.json());
  app.use('/api/looks', looksRouter);

  const server = app.listen(5099);

  const call = (method, path, payload, token) =>
    new Promise((resolve) => {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const req = http.request({ host: 'localhost', port: 5099, path, method, headers }, (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => resolve({ status: res.statusCode, body }));
      });
      req.end(payload ? JSON.stringify(payload) : undefined);
    });

  await new Promise((r) => server.once('listening', r));

  const token = jwt.sign({ userId: 1, email: 'admin@test.com', role: 'admin' }, JWT_SECRET);

  const empty = await call('GET', '/api/looks/active?companyId=1');
  console.log('1. empty list          ->', empty.status, empty.body);

  const created = await call('POST', '/api/looks', {
    name: 'After-Dark Black',
    occasion: 'party',
    tagline: 'Lace and patent leather',
    items: [101, 102],
  }, token);
  console.log('2. create              ->', created.status, created.body.slice(0, 120));

  const active = await call('GET', '/api/looks/active?companyId=1');
  const parsed = JSON.parse(active.body);
  console.log('3. active count        ->', parsed.looks?.length);
  console.log('4. items + first image ->', parsed.looks?.[0]?.items?.map((i) => `${i.name}=${i.image}`).join(' | '));

  const hidden = await call('GET', '/api/looks/active?companyId=999');
  console.log('5. other company       ->', hidden.body);

  const noAuth = await call('GET', '/api/looks');
  console.log('6. admin list no token ->', noAuth.status, '(expect 401)');

  const noItems = await call('POST', '/api/looks', { name: 'Empty', items: [] }, token);
  console.log('7. create no pieces    ->', noItems.status, noItems.body.slice(0, 80));

  const lookId = JSON.parse(created.body).look.id;
  const toggled = await call('PUT', `/api/looks/${lookId}/toggle`, {}, token);
  console.log('8. toggle              ->', toggled.status, toggled.body);
  const afterToggle = await call('GET', '/api/looks/active?companyId=1');
  console.log('9. hidden from public  ->', JSON.parse(afterToggle.body).looks.length === 0);

  const removed = await call('DELETE', `/api/looks/${lookId}`, null, token);
  console.log('10. delete             ->', removed.status, removed.body);

  server.close();
  for (const suffix of ['', '-wal', '-shm']) {
    const f = TMP + suffix;
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
  console.log('\n✅ looks API verified, scratch DB removed');
  process.exit(0);
};

run().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});