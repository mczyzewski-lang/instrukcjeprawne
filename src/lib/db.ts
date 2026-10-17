import "server-only";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { LEAD_CONFIGURATIONS } from "@/content/categories";
import { SEED_EXPERTS } from "@/content/experts";
import { SEED_INSTRUCTIONS, SEED_QUESTIONS } from "@/content";

/**
 * Relacyjna baza SQLite (wbudowany moduł node:sqlite – bez natywnych zależności).
 * Treść instrukcji to dokument JSON w dwóch wersjach: robocza (draft_json)
 * i opublikowana (published_json). Dzięki temu szkice i treści zatwierdzone
 * są wyraźnie rozdzielone, a strona publiczna nigdy nie czyta szkicu przypadkiem.
 */

const SCHEMA = `
CREATE TABLE IF NOT EXISTS instructions (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  category TEXT NOT NULL,
  draft_json TEXT NOT NULL,
  published_json TEXT,
  updated_at TEXT NOT NULL,
  published_at TEXT,
  reviewed_by TEXT
);
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  priority TEXT,
  draft_json TEXT NOT NULL,
  published_json TEXT,
  updated_at TEXT NOT NULL,
  published_at TEXT
);
CREATE INDEX IF NOT EXISTS questions_status ON questions(status);
CREATE TABLE IF NOT EXISTS lead_configs (
  topic TEXT PRIMARY KEY,
  json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  topic TEXT NOT NULL,
  partner TEXT NOT NULL,
  instruction_slug TEXT,
  path_id TEXT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  context TEXT,
  consents_json TEXT NOT NULL,
  status TEXT NOT NULL,
  forward_attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  forwarded_at TEXT
);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  name TEXT NOT NULL,
  session_id TEXT,
  instruction_slug TEXT,
  path_id TEXT,
  props_json TEXT
);
CREATE INDEX IF NOT EXISTS events_name ON events(name);
CREATE INDEX IF NOT EXISTS events_session ON events(session_id);
CREATE TABLE IF NOT EXISTS illustrations (
  id TEXT PRIMARY KEY,
  target_key TEXT NOT NULL,
  status TEXT NOT NULL,
  source TEXT NOT NULL,
  prompt TEXT,
  prompt_version TEXT,
  model TEXT,
  file_name TEXT,
  mime TEXT,
  alt TEXT NOT NULL,
  created_at TEXT NOT NULL,
  reviewed_at TEXT,
  error TEXT
);
CREATE INDEX IF NOT EXISTS illustrations_target ON illustrations(target_key);
CREATE TABLE IF NOT EXISTS experts (
  id TEXT PRIMARY KEY,
  json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS chats (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  topic TEXT NOT NULL,
  partner TEXT NOT NULL,
  expert_id TEXT,
  instruction_slug TEXT,
  path_id TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  marketing_consent INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open',
  lead_id TEXT,
  user_seen_at TEXT,
  admin_seen_at TEXT,
  sms_status TEXT
);
CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  author_name TEXT,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS chat_messages_chat ON chat_messages(chat_id);
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL
);
`;

declare global {
  var __ipDb: DatabaseSync | undefined;
}

export function dataDir() {
  return path.resolve(/*turbopackIgnore: true*/ process.env.DATA_DIR || path.join(process.cwd(), "data"));
}

/**
 * Podczas `next build` kilka procesów równolegle prerenderuje strony. Każdy dostaje własną bazę
 * w pamięci z treściami startowymi – bez blokad pliku i bez zależności od wolumenu (którego w buildzie nie ma).
 * Prawdziwa baza powstaje przy starcie serwera, a ISR odświeża strony z jej danymi.
 */
function isBuildPhase() {
  return process.env.NEXT_PHASE === "phase-production-build" || process.env.IP_BUILD_DB === "memory";
}

function open(): DatabaseSync {
  const configured = isBuildPhase() ? ":memory:" : process.env.DATABASE_PATH;
  const file = configured === ":memory:" ? ":memory:" : path.resolve(/*turbopackIgnore: true*/ configured || path.join(dataDir(), "app.db"));
  if (file !== ":memory:") mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  // busy_timeout najpierw – kolejne polecenia czekają na blokadę zamiast od razu zgłaszać „database is locked”
  db.exec("PRAGMA busy_timeout = 10000;");
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  db.exec(SCHEMA);
  migrate(db);
  seed(db);
  return db;
}

/** Dodaje kolumny, które pojawiły się po pierwszym wdrożeniu (istniejące bazy na wolumenie). */
function migrate(db: DatabaseSync) {
  const cols = new Set((db.prepare("PRAGMA table_info(chats)").all() as { name: string }[]).map((c) => c.name));
  if (!cols.has("channel")) db.exec("ALTER TABLE chats ADD COLUMN channel TEXT NOT NULL DEFAULT 'chat'");
  if (!cols.has("subject")) db.exec("ALTER TABLE chats ADD COLUMN subject TEXT");
  if (!cols.has("mail_status")) db.exec("ALTER TABLE chats ADD COLUMN mail_status TEXT");
  const mcols = new Set((db.prepare("PRAGMA table_info(chat_messages)").all() as { name: string }[]).map((c) => c.name));
  if (!mcols.has("attachment")) db.exec("ALTER TABLE chat_messages ADD COLUMN attachment TEXT");
}

/** Wgrywa brakujące treści startowe. Nigdy nie nadpisuje treści edytowanych w CMS. */
function seed(db: DatabaseSync) {
  const now = new Date().toISOString();
  const insIns = db.prepare(
    "INSERT OR IGNORE INTO instructions (id, slug, status, category, draft_json, published_json, updated_at) VALUES (?, ?, ?, ?, ?, NULL, ?)",
  );
  const insQ = db.prepare(
    "INSERT OR IGNORE INTO questions (id, slug, status, category, title, priority, draft_json, published_json, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?)",
  );
  const insLead = db.prepare("INSERT OR IGNORE INTO lead_configs (topic, json) VALUES (?, ?)");
  const insExpert = db.prepare("INSERT OR IGNORE INTO experts (id, json, updated_at) VALUES (?, ?, ?)");
  // pytanie z kolejki (pusty szkic, nigdy nieedytowany), na które dodano odpowiedź w treściach startowych → aktualizacja
  const upgradeQ = db.prepare(
    `UPDATE questions SET status = ?, title = ?, draft_json = ?, updated_at = ?
     WHERE id = ? AND status = 'draft' AND published_json IS NULL AND json_extract(draft_json, '$.answer') = ''`,
  );
  // nowe pole bez wpływu na treść merytoryczną – uzupełniamy w instrukcjach zapisanych wcześniej (bez nadpisywania edycji)
  const fillPlanName = db.prepare(
    `UPDATE instructions SET draft_json = json_set(draft_json, '$.planName', ?),
       published_json = CASE WHEN published_json IS NULL THEN NULL ELSE json_set(published_json, '$.planName', ?) END
     WHERE id = ? AND json_extract(draft_json, '$.planName') IS NULL`,
  );
  db.exec("BEGIN IMMEDIATE");
  try {
    for (const i of SEED_INSTRUCTIONS) insIns.run(i.id, i.slug, i.editorialStatus, i.category, JSON.stringify(i), now);
    for (const i of SEED_INSTRUCTIONS) if (i.planName) fillPlanName.run(i.planName, i.planName, i.id);
    for (const q of SEED_QUESTIONS) insQ.run(q.id, q.slug, q.status, q.category, q.title, q.priority ?? null, JSON.stringify(q), now);
    for (const q of SEED_QUESTIONS) if (q.status !== "draft") upgradeQ.run(q.status, q.title, JSON.stringify(q), now, q.id);
    for (const l of LEAD_CONFIGURATIONS) insLead.run(l.topic, JSON.stringify(l));
    for (const e of SEED_EXPERTS) insExpert.run(e.id, JSON.stringify(e), now);
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

export function getDb(): DatabaseSync {
  if (!globalThis.__ipDb) globalThis.__ipDb = open();
  return globalThis.__ipDb;
}

/** Tylko do testów. */
export function resetDbForTests() {
  globalThis.__ipDb?.close();
  globalThis.__ipDb = undefined;
}
