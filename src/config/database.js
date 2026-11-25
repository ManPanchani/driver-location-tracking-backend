
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const databaseDirectory = path.join(__dirname, '../../database');

if (!fs.existsSync(databaseDirectory)) {
  fs.mkdirSync(databaseDirectory, { recursive: true });
}

const databaseFile =
  process.env.NODE_ENV === 'test'
    ? 'driver_tracking_test.sqlite'
    : 'driver_tracking.sqlite';

const databasePath = path.join(
  databaseDirectory,
  databaseFile
);

const db = new Database(databasePath);

// Safer SQLite settings for this local tracking API.
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

db.exec(`
  CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY,
    latitude REAL NOT NULL CHECK(latitude >= -90 AND latitude <= 90),
    longitude REAL NOT NULL CHECK(longitude >= -180 AND longitude <= 180),
    captured_at TEXT NOT NULL,
    received_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

 CREATE INDEX IF NOT EXISTS idx_locations_captured_at
ON locations(captured_at);

  CREATE TABLE IF NOT EXISTS sync_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    received_count INTEGER NOT NULL,
    inserted_count INTEGER NOT NULL,
    duplicate_count INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

module.exports = db;
