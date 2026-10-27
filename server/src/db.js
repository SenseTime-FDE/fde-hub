'use strict';
/**
 * SQLite（node:sqlite，零依赖）。库文件默认 data/site.db，可用 ALLFDE_DB 指定（测试用 :memory:）。
 * 表：user · session · lead（预约演示与技术交流，source 区分）· partner_app · event · event_reg · job · job_app · audit
 */
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const ROOT = path.join(__dirname, '..');
const DATA = process.env.ALLFDE_DATA || path.join(ROOT, 'data');
const FILE = process.env.ALLFDE_DB || path.join(DATA, 'site.db');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS user (
  id INTEGER PRIMARY KEY, account TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','marketing','hr')),
  password_hash TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active',
  failed INTEGER NOT NULL DEFAULT 0, locked_until TEXT, created_at TEXT NOT NULL, last_login_at TEXT
);
CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES user(id), csrf TEXT NOT NULL,
  created_at TEXT NOT NULL, expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS lead (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, company TEXT NOT NULL, title TEXT, phone TEXT NOT NULL, email TEXT,
  city TEXT, industry TEXT, interest TEXT, message TEXT, source TEXT,
  status TEXT NOT NULL DEFAULT 'new', note TEXT, created_at TEXT NOT NULL, updated_at TEXT
);
CREATE TABLE IF NOT EXISTS partner_app (
  id INTEGER PRIMARY KEY, company TEXT NOT NULL, contact TEXT NOT NULL, title TEXT, phone TEXT NOT NULL, email TEXT,
  city TEXT, partner_type TEXT NOT NULL, industries TEXT, team_size TEXT, intro TEXT,
  status TEXT NOT NULL DEFAULT 'new', note TEXT, created_at TEXT NOT NULL, updated_at TEXT
);
CREATE TABLE IF NOT EXISTS event (
  id INTEGER PRIMARY KEY, slug TEXT UNIQUE NOT NULL, title TEXT NOT NULL, kind TEXT NOT NULL,
  city TEXT, venue TEXT, starts_at TEXT NOT NULL, ends_at TEXT, summary TEXT, body TEXT,
  capacity INTEGER, reg_open INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL, updated_at TEXT
);
CREATE TABLE IF NOT EXISTS event_reg (
  id INTEGER PRIMARY KEY, event_id INTEGER NOT NULL REFERENCES event(id), name TEXT NOT NULL, company TEXT NOT NULL,
  title TEXT, phone TEXT NOT NULL, email TEXT, note TEXT, status TEXT NOT NULL DEFAULT 'new', created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS job (
  id INTEGER PRIMARY KEY, title TEXT NOT NULL, team TEXT, kind TEXT NOT NULL, city TEXT NOT NULL,
  headcount INTEGER, summary TEXT, duties TEXT, requirements TEXT, status TEXT NOT NULL DEFAULT 'draft',
  sort INTEGER NOT NULL DEFAULT 100, created_at TEXT NOT NULL, updated_at TEXT
);
CREATE TABLE IF NOT EXISTS job_app (
  id INTEGER PRIMARY KEY, job_id INTEGER NOT NULL REFERENCES job(id), name TEXT NOT NULL, phone TEXT NOT NULL,
  email TEXT NOT NULL, city TEXT, years TEXT, message TEXT, resume_file TEXT, resume_name TEXT,
  status TEXT NOT NULL DEFAULT 'new', note TEXT, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS audit (
  id INTEGER PRIMARY KEY, user_id INTEGER, action TEXT NOT NULL, target TEXT, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_event_status ON event(status, starts_at);
CREATE INDEX IF NOT EXISTS idx_job_status ON job(status, sort);
CREATE INDEX IF NOT EXISTS idx_reg_event ON event_reg(event_id);
CREATE INDEX IF NOT EXISTS idx_app_job ON job_app(job_id);
`;

let db;
function open() {
  if (db) return db;
  if (FILE !== ':memory:') fs.mkdirSync(path.dirname(FILE), { recursive: true });
  db = new DatabaseSync(FILE);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 3000;');
  db.exec(SCHEMA);
  migrate(db);
  return db;
}
/** 增量迁移：v1.1 新增列（老库自动补上） */
function migrate(d) {
  const cols = (t) => d.prepare(`PRAGMA table_info(${t})`).all().map((c) => c.name);
  const add = (t, col, def) => { if (!cols(t).includes(col)) d.exec(`ALTER TABLE ${t} ADD COLUMN ${col} ${def}`); };
  add('event', 'cover', 'TEXT');            // 活动封面图（data/uploads/events/ 下的文件名）
  add('partner_app', 'has_what', 'TEXT');   // 有客户 / 有产品 / 有团队（可多选）
}
const now = () => new Date().toISOString();
const all = (sql, ...a) => open().prepare(sql).all(...a);
const get = (sql, ...a) => open().prepare(sql).get(...a);
const run = (sql, ...a) => open().prepare(sql).run(...a);
function insert(table, row) {
  const keys = Object.keys(row);
  const r = run(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`, ...keys.map((k) => row[k]));
  return Number(r.lastInsertRowid);
}
function update(table, id, row) {
  const keys = Object.keys(row);
  if (!keys.length) return;
  run(`UPDATE ${table} SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`, ...keys.map((k) => row[k]), id);
}
function audit(userId, action, target) { insert('audit', { user_id: userId || null, action, target: target || null, created_at: now() }); }
const UPLOADS = path.join(DATA, 'uploads');
const EVENT_COVERS = path.join(UPLOADS, 'events');

module.exports = { open, all, get, run, insert, update, audit, now, DATA, UPLOADS, EVENT_COVERS, FILE };
