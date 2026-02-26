const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs-extra');

const dbPath = path.join(__dirname, 'botdata', 'database.sqlite');
fs.ensureDirSync(path.dirname(dbPath));

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    exp INTEGER DEFAULT 0,
    money INTEGER DEFAULT 0,
    banned INTEGER DEFAULT 0,
    banReason TEXT,
    data TEXT DEFAULT '{}'
  );

  CREATE TABLE IF NOT EXISTS currencies (
    id TEXT PRIMARY KEY,
    name TEXT,
    balance INTEGER DEFAULT 0,
    bank INTEGER DEFAULT 0,
    exp INTEGER DEFAULT 0,
    lastDaily TEXT,
    dailyStreak INTEGER DEFAULT 0,
    lastWork TEXT,
    transactions TEXT DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS threads (
    id TEXT PRIMARY KEY,
    name TEXT,
    approved INTEGER DEFAULT 0,
    banned INTEGER DEFAULT 0,
    banReason TEXT,
    settings TEXT DEFAULT '{}',
    data TEXT DEFAULT '{}'
  );

  CREATE TABLE IF NOT EXISTS bank_system (
    userId TEXT PRIMARY KEY,
    full_name TEXT,
    father_name TEXT,
    age INTEGER,
    city TEXT,
    account_number TEXT UNIQUE,
    bank_balance INTEGER DEFAULT 0,
    pin TEXT,
    registration_step INTEGER DEFAULT 0,
    created_at TEXT
  );
`);

try {
  db.exec(`ALTER TABLE currencies ADD COLUMN exp INTEGER DEFAULT 0`);
} catch (e) {
}

module.exports = db;
