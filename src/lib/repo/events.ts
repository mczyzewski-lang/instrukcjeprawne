import "server-only";
import { getDb } from "../db";

/**
 * Analityka produktowa – zminimalizowana:
 * - zbierana tylko po zgodzie użytkownika (kontrola po stronie klienta),
 * - bez IP, bez danych osobowych, bez treści wpisywanych w formularze,
 * - identyfikator sesji jest losowy i trwa tylko do zamknięcia karty.
 */

export const EVENT_NAMES = [
  "search_performed",
  "instruction_opened",
  "decision_tree_started",
  "decision_answer_selected",
  "decision_tree_completed",
  "path_selected",
  "instruction_step_completed",
  "pdf_downloaded",
  "expert_cta_clicked",
  "lead_submitted",
  "plan_generated",
  "plan_discuss_clicked",
] as const;

export type EventName = (typeof EVENT_NAMES)[number];

/** Zdarzenia uznawane za „konkretny krok w kierunku rozwiązania problemu”. */
export const ACTION_EVENTS: EventName[] = ["decision_tree_completed", "path_selected", "instruction_step_completed", "pdf_downloaded", "expert_cta_clicked", "lead_submitted", "plan_generated", "plan_discuss_clicked"];

const ALLOWED_PROPS = new Set(["query_length", "results", "node", "option", "outcomes", "step", "checklist_item", "path", "uncertain", "topic", "source"]);

export function recordEvent(e: { name: EventName; sessionId?: string; instructionSlug?: string; pathId?: string; props?: Record<string, unknown> }) {
  const props: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(e.props ?? {})) {
    if (!ALLOWED_PROPS.has(k)) continue;
    if (typeof v === "number" || typeof v === "boolean") props[k] = v;
    else if (typeof v === "string") props[k] = v.slice(0, 80);
  }
  getDb()
    .prepare("INSERT INTO events (created_at, name, session_id, instruction_slug, path_id, props_json) VALUES (?, ?, ?, ?, ?, ?)")
    .run(new Date().toISOString(), e.name, e.sessionId?.slice(0, 40) ?? null, e.instructionSlug?.slice(0, 120) ?? null, e.pathId?.slice(0, 80) ?? null, JSON.stringify(props));
}

export interface AnalyticsSummary {
  totals: Record<string, number>;
  instructionSessions: number;
  instructionSessionsWithAction: number;
  actionRate: number | null;
  byInstruction: { slug: string; opened: number; completedTrees: number; pdf: number; cta: number; leads: number }[];
  byPath: { slug: string; path: string; selected: number; leads: number }[];
}

export function analyticsSummary(sinceDays = 30): AnalyticsSummary {
  const db = getDb();
  const since = new Date(Date.now() - sinceDays * 86400_000).toISOString();
  const totals = Object.fromEntries(
    (db.prepare("SELECT name, COUNT(*) n FROM events WHERE created_at >= ? GROUP BY name").all(since) as { name: string; n: number }[]).map((r) => [r.name, r.n]),
  );
  const placeholders = ACTION_EVENTS.map(() => "?").join(",");
  const sessions = db
    .prepare(
      `SELECT COUNT(DISTINCT o.session_id || '|' || o.instruction_slug) n,
              COUNT(DISTINCT CASE WHEN a.id IS NOT NULL THEN o.session_id || '|' || o.instruction_slug END) m
       FROM events o
       LEFT JOIN events a ON a.session_id = o.session_id AND a.instruction_slug = o.instruction_slug AND a.name IN (${placeholders}) AND a.created_at >= ?
       WHERE o.name = 'instruction_opened' AND o.session_id IS NOT NULL AND o.created_at >= ?`,
    )
    .get(...ACTION_EVENTS, since, since) as { n: number; m: number };
  const byInstruction = db
    .prepare(
      `SELECT instruction_slug slug,
         SUM(name='instruction_opened') opened, SUM(name='decision_tree_completed') completedTrees,
         SUM(name='pdf_downloaded') pdf, SUM(name='expert_cta_clicked') cta, SUM(name='lead_submitted') leads
       FROM events WHERE instruction_slug IS NOT NULL AND created_at >= ? GROUP BY instruction_slug ORDER BY opened DESC`,
    )
    .all(since) as AnalyticsSummary["byInstruction"];
  const byPath = db
    .prepare(
      `SELECT instruction_slug slug, path_id path, SUM(name='path_selected') selected, SUM(name='lead_submitted') leads
       FROM events WHERE path_id IS NOT NULL AND created_at >= ? GROUP BY instruction_slug, path_id ORDER BY selected DESC LIMIT 50`,
    )
    .all(since) as AnalyticsSummary["byPath"];
  return {
    totals,
    instructionSessions: sessions.n,
    instructionSessionsWithAction: sessions.m,
    actionRate: sessions.n ? sessions.m / sessions.n : null,
    byInstruction,
    byPath,
  };
}
