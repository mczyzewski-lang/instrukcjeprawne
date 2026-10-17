import "server-only";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { LEAD_CONFIGURATIONS } from "@/content/categories";
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
  seed(db);
  return db;
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
  db.exec("BEGIN IMMEDIATE");
  try {
    for (const i of SEED_INSTRUCTIONS) insIns.run(i.id, i.slug, i.editorialStatus, i.category, JSON.stringify(i), now);
    for (const q of SEED_QUESTIONS) insQ.run(q.id, q.slug, q.status, q.category, q.title, q.priority ?? null, JSON.stringify(q), now);
    for (const l of LEAD_CONFIGURATIONS) insLead.run(l.topic, JSON.stringify(l));
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
