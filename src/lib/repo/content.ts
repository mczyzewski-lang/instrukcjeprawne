import "server-only";
import { showUnreviewed } from "../config";
import { getDb } from "../db";
import { parseInstruction, parseQuestion } from "../schemas";
import type { EditorialStatus, Instruction, Question } from "../types";

/**
 * Repozytorium treści (instrukcje i pytania).
 *
 * Zasady widoczności publicznej:
 * - status „archived” → niewidoczne,
 * - istnieje wersja opublikowana → pokazujemy ją (zatwierdzona przez człowieka),
 * - brak publikacji i status „review” → pokazujemy wersję roboczą TYLKO gdy PUBLIC_SHOW_UNREVIEWED != false,
 *   z wyraźnym oznaczeniem i noindex,
 * - „draft” → nigdy publicznie.
 */

export interface Visible<T> {
  doc: T;
  /** true = wersja zatwierdzona przez człowieka; false = przed weryfikacją */
  reviewed: boolean;
}

interface ContentRow {
  id: string;
  slug: string;
  status: EditorialStatus;
  category: string;
  draft_json: string;
  published_json: string | null;
  updated_at: string;
  published_at: string | null;
}

function visible<T>(row: ContentRow | undefined): Visible<T> | null {
  if (!row || row.status === "archived") return null;
  if (row.published_json) return { doc: JSON.parse(row.published_json) as T, reviewed: true };
  if (row.status === "review" && showUnreviewed()) return { doc: JSON.parse(row.draft_json) as T, reviewed: false };
  return null;
}

const today = () => new Date().toISOString().slice(0, 10);

/* ---------- Instrukcje ---------- */

export function getPublicInstruction(slug: string): Visible<Instruction> | null {
  const row = getDb().prepare("SELECT * FROM instructions WHERE slug = ?").get(slug) as ContentRow | undefined;
  return visible<Instruction>(row);
}

export function listPublicInstructions(): Visible<Instruction>[] {
  const rows = getDb().prepare("SELECT * FROM instructions ORDER BY rowid").all() as unknown as ContentRow[];
  return rows.map((r) => visible<Instruction>(r)).filter((v): v is Visible<Instruction> => v !== null);
}

export interface AdminContentItem {
  id: string;
  slug: string;
  title: string;
  status: EditorialStatus;
  category: string;
  updatedAt: string;
  publishedAt: string | null;
  hasPublished: boolean;
  hasUnpublishedChanges: boolean;
  priority?: string | null;
}

export function listAdminInstructions(): AdminContentItem[] {
  const rows = getDb().prepare("SELECT * FROM instructions ORDER BY rowid").all() as unknown as ContentRow[];
  return rows.map((r) => {
    const draft = JSON.parse(r.draft_json) as Instruction;
    return {
      id: r.id,
      slug: r.slug,
      title: draft.title,
      status: r.status,
      category: r.category,
      updatedAt: r.updated_at,
      publishedAt: r.published_at,
      hasPublished: Boolean(r.published_json),
      hasUnpublishedChanges: Boolean(r.published_json) && r.published_json !== r.draft_json,
    };
  });
}

export function getInstructionForEdit(id: string): { draft: Instruction; published: Instruction | null; status: EditorialStatus } | null {
  const row = getDb().prepare("SELECT * FROM instructions WHERE id = ?").get(id) as ContentRow | undefined;
  if (!row) return null;
  return { draft: JSON.parse(row.draft_json), published: row.published_json ? JSON.parse(row.published_json) : null, status: row.status };
}

export type SaveResult = { ok: true } | { ok: false; errors: string[] };

export function saveInstructionDraft(id: string, data: unknown, status: "draft" | "review"): SaveResult {
  const parsed = parseInstruction({ ...(data as object), editorialStatus: status });
  if (!parsed.ok) return parsed;
  const doc = { ...parsed.value, id, updatedAt: today() };
  const db = getDb();
  const clash = db.prepare("SELECT id FROM instructions WHERE slug = ? AND id != ?").get(doc.slug, id);
  if (clash) return { ok: false, errors: ["Slug jest już używany przez inną instrukcję"] };
  const exists = db.prepare("SELECT id FROM instructions WHERE id = ?").get(id);
  if (exists) {
    db.prepare("UPDATE instructions SET slug = ?, status = ?, category = ?, draft_json = ?, updated_at = ? WHERE id = ?").run(
      doc.slug,
      status,
      doc.category,
      JSON.stringify(doc),
      new Date().toISOString(),
      id,
    );
  } else {
    db.prepare("INSERT INTO instructions (id, slug, status, category, draft_json, updated_at) VALUES (?, ?, ?, ?, ?, ?)").run(
      id,
      doc.slug,
      status,
      doc.category,
      JSON.stringify(doc),
      new Date().toISOString(),
    );
  }
  return { ok: true };
}

export function publishInstruction(id: string, reviewer: string): SaveResult {
  const current = getInstructionForEdit(id);
  if (!current) return { ok: false, errors: ["Nie znaleziono instrukcji"] };
  const doc: Instruction = { ...current.draft, editorialStatus: "published", legalReviewedAt: today(), legalReviewedBy: reviewer };
  const parsed = parseInstruction(doc);
  if (!parsed.ok) return parsed;
  const json = JSON.stringify(parsed.value);
  getDb()
    .prepare("UPDATE instructions SET status = 'published', draft_json = ?, published_json = ?, published_at = ?, reviewed_by = ?, updated_at = ? WHERE id = ?")
    .run(json, json, new Date().toISOString(), reviewer, new Date().toISOString(), id);
  return { ok: true };
}

export function unpublishInstruction(id: string, archive = false): SaveResult {
  const current = getInstructionForEdit(id);
  if (!current) return { ok: false, errors: ["Nie znaleziono instrukcji"] };
  const status: EditorialStatus = archive ? "archived" : "draft";
  const draft = JSON.stringify({ ...current.draft, editorialStatus: status });
  getDb().prepare("UPDATE instructions SET status = ?, draft_json = ?, published_json = NULL, updated_at = ? WHERE id = ?").run(status, draft, new Date().toISOString(), id);
  return { ok: true };
}

/* ---------- Pytania ---------- */

export function getPublicQuestion(slug: string): Visible<Question> | null {
  const row = getDb().prepare("SELECT * FROM questions WHERE slug = ?").get(slug) as ContentRow | undefined;
  return visible<Question>(row);
}

export function listPublicQuestions(): Visible<Question>[] {
  const rows = getDb().prepare("SELECT * FROM questions WHERE status IN ('published','review') ORDER BY rowid").all() as unknown as ContentRow[];
  return rows.map((r) => visible<Question>(r)).filter((v): v is Visible<Question> => v !== null);
}

export function listAdminQuestions(filter?: { status?: EditorialStatus; category?: string; q?: string }): AdminContentItem[] {
  const where: string[] = [];
  const params: string[] = [];
  if (filter?.status) {
    where.push("status = ?");
    params.push(filter.status);
  }
  if (filter?.category) {
    where.push("category = ?");
    params.push(filter.category);
  }
  if (filter?.q) {
    where.push("(title LIKE ? OR slug LIKE ?)");
    params.push(`%${filter.q}%`, `%${filter.q}%`);
  }
  const sql = `SELECT * FROM questions ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 ELSE 3 END, rowid`;
  const rows = getDb().prepare(sql).all(...params) as unknown as (ContentRow & { title: string; priority: string | null })[];
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    status: r.status,
    category: r.category,
    updatedAt: r.updated_at,
    publishedAt: r.published_at,
    hasPublished: Boolean(r.published_json),
    hasUnpublishedChanges: Boolean(r.published_json) && r.published_json !== r.draft_json,
    priority: r.priority,
  }));
}

export function countQuestionsByStatus(): Record<string, number> {
  const rows = getDb().prepare("SELECT status, COUNT(*) as n FROM questions GROUP BY status").all() as { status: string; n: number }[];
  return Object.fromEntries(rows.map((r) => [r.status, r.n]));
}

export function getQuestionForEdit(id: string): { draft: Question; published: Question | null; status: EditorialStatus } | null {
  const row = getDb().prepare("SELECT * FROM questions WHERE id = ?").get(id) as ContentRow | undefined;
  if (!row) return null;
  return { draft: JSON.parse(row.draft_json), published: row.published_json ? JSON.parse(row.published_json) : null, status: row.status };
}

export function saveQuestion(data: unknown, status: "draft" | "review"): SaveResult & { id?: string } {
  const parsed = parseQuestion({ ...(data as object), status });
  if (!parsed.ok) return parsed;
  const doc = { ...parsed.value, updatedAt: today() };
  const db = getDb();
  const clash = db.prepare("SELECT id FROM questions WHERE slug = ? AND id != ?").get(doc.slug, doc.id);
  if (clash) return { ok: false, errors: ["Slug jest już używany przez inne pytanie"] };
  db.prepare(
    `INSERT INTO questions (id, slug, status, category, title, priority, draft_json, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET slug = excluded.slug, status = excluded.status, category = excluded.category, title = excluded.title,
       priority = excluded.priority, draft_json = excluded.draft_json, updated_at = excluded.updated_at`,
  ).run(doc.id, doc.slug, status, doc.category, doc.title, doc.priority ?? null, JSON.stringify(doc), new Date().toISOString());
  return { ok: true, id: doc.id };
}

export function publishQuestion(id: string): SaveResult {
  const current = getQuestionForEdit(id);
  if (!current) return { ok: false, errors: ["Nie znaleziono pytania"] };
  const doc: Question = { ...current.draft, status: "published", legalReviewedAt: today() };
  const parsed = parseQuestion(doc);
  if (!parsed.ok) return parsed;
  const json = JSON.stringify(parsed.value);
  getDb()
    .prepare("UPDATE questions SET status = 'published', draft_json = ?, published_json = ?, published_at = ?, updated_at = ? WHERE id = ?")
    .run(json, json, new Date().toISOString(), new Date().toISOString(), id);
  return { ok: true };
}

export function unpublishQuestion(id: string, archive = false): SaveResult {
  const current = getQuestionForEdit(id);
  if (!current) return { ok: false, errors: ["Nie znaleziono pytania"] };
  const status: EditorialStatus = archive ? "archived" : "draft";
  getDb()
    .prepare("UPDATE questions SET status = ?, draft_json = ?, published_json = NULL, updated_at = ? WHERE id = ?")
    .run(status, JSON.stringify({ ...current.draft, status }), new Date().toISOString(), id);
  return { ok: true };
}

export function questionExists(slug: string): boolean {
  return Boolean(getDb().prepare("SELECT 1 FROM questions WHERE slug = ?").get(slug));
}
