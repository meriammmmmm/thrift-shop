#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Ensure database directory exists
const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
  console.log('Creating database directory...');
  fs.mkdirSync(dbDir, { recursive: true });
}

// Check if database file exists
const dbPath = process.env.DB_PATH || path.join(dbDir, 'thrift_shop.db');
const dbExists = fs.existsSync(dbPath);

if (!dbExists) {
  console.log('Database file does not exist, it will be created on first connection');
}

// Start the server
console.log('Starting Thrift Shop Backend...');
require('./server.js');
