#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Only create database directory if not using PostgreSQL
if (!process.env.DATABASE_URL) {
  const dbDir = path.join(__dirname, 'database');
  if (!fs.existsSync(dbDir)) {
    console.log('Creating database directory...');
    fs.mkdirSync(dbDir, { recursive: true });
  }
}

// Start the server immediately
console.log('Starting Thrift Shop Backend...');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Port:', process.env.PORT || 5001);
require('./server.js');
