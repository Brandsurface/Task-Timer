// db.js — SQLite database setup
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/tasktimer.db');
const db = new Database(DB_PATH);

// Performance settings
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('synchronous = NORMAL');

// ── SCHEMA ──
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    email       TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    name        TEXT    NOT NULL,
    password    TEXT    NOT NULL,
    role        TEXT    NOT NULL DEFAULT 'user',
    day_end_hour INTEGER NOT NULL DEFAULT 17,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name           TEXT    NOT NULL,
    color          TEXT    NOT NULL DEFAULT '#f07c28',
    archived       INTEGER NOT NULL DEFAULT 0,
    sort_order     INTEGER NOT NULL DEFAULT 0,
    budget_seconds INTEGER NOT NULL DEFAULT 0,
    created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS time_entries (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id    INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    date       TEXT    NOT NULL,
    start_time TEXT    NOT NULL,
    end_time   TEXT    NOT NULL,
    seconds    INTEGER NOT NULL,
    note       TEXT    NOT NULL DEFAULT '',
    committed  INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_entries_user_date ON time_entries(user_id, date);
  CREATE INDEX IF NOT EXISTS idx_entries_committed ON time_entries(committed);
  CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
`);

// ── MIGRATIONS: add columns if they don't exist yet (safe on existing DBs) ──
const taskCols = db.pragma('table_info(tasks)').map(c => c.name);
if (!taskCols.includes('budget_seconds')) {
  db.exec('ALTER TABLE tasks ADD COLUMN budget_seconds INTEGER NOT NULL DEFAULT 0');
}
if (!taskCols.includes('pending_start')) {
  db.exec('ALTER TABLE tasks ADD COLUMN pending_start INTEGER NOT NULL DEFAULT 0');
}
if (!taskCols.includes('pinned')) {
  db.exec('ALTER TABLE tasks ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0');
}

const userCols = db.pragma('table_info(users)').map(c => c.name);
if (!userCols.includes('reset_token')) {
  db.exec('ALTER TABLE users ADD COLUMN reset_token TEXT');
  db.exec('ALTER TABLE users ADD COLUMN reset_token_expires TEXT');
}
if (!userCols.includes('preferences')) {
  db.exec('ALTER TABLE users ADD COLUMN preferences TEXT');
}
if (!userCols.includes('day_end_minute')) {
  db.exec('ALTER TABLE users ADD COLUMN day_end_minute INTEGER NOT NULL DEFAULT 0');
}
if (!userCols.includes('api_key')) {
  db.exec('ALTER TABLE users ADD COLUMN api_key TEXT');
}

// Notes table (Box feature)
db.exec(`
  CREATE TABLE IF NOT EXISTS notes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      TEXT    NOT NULL DEFAULT 'Untitled',
    content    TEXT    NOT NULL DEFAULT '',
    color      TEXT    NOT NULL DEFAULT 'default',
    pinned     INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id, pinned DESC, updated_at DESC);
`);

module.exports = db;
