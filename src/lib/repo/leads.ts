import "server-only";
import { createHmac, randomUUID } from "node:crypto";
import { leadWebhook, leadWebhookSecret } from "../config";
import { getDb } from "../db";
import type { LeadInput } from "../schemas";
import type { LeadConfiguration } from "../types";

/**
 * Obsługa zgłoszeń do ekspertów.
 * 1) Zgłoszenie zawsze zapisujemy w bazie (źródło prawdy, wgląd w panelu).
 * 2) Jeśli dla tematu skonfigurowano webhook (zmienna środowiskowa), przekazujemy je
 *    do właściwego partnera z podpisem HMAC. Bez konfiguracji – status „not_configured”.
 * Nie wysyłamy danych na żadne adresy spoza konfiguracji.
 */

export type LeadStatus = "not_configured" | "forwarded" | "failed";

export interface LeadRow {
  id: string;
  created_at: string;
  topic: string;
  partner: string;
  instruction_slug: string | null;
  path_id: string | null;
  name: string;
  phone: string;
  email: string | null;
  context: string | null;
  consents_json: string;
  status: LeadStatus;
  forward_attempts: number;
  last_error: string | null;
  forwarded_at: string | null;
}

export function listLeadConfigs(): LeadConfiguration[] {
  const rows = getDb().prepare("SELECT json FROM lead_configs ORDER BY topic").all() as { json: string }[];
  return rows.map((r) => JSON.parse(r.json));
}

export function getLeadConfig(topic: string): LeadConfiguration | null {
  const row = getDb().prepare("SELECT json FROM lead_configs WHERE topic = ?").get(topic) as { json: string } | undefined;
  return row ? JSON.parse(row.json) : null;
}

export function saveLeadConfig(cfg: LeadConfiguration) {
  getDb()
    .prepare("INSERT INTO lead_configs (topic, json) VALUES (?, ?) ON CONFLICT(topic) DO UPDATE SET json = excluded.json")
    .run(cfg.topic, JSON.stringify(cfg));
}

export function leadConfigState(cfg: LeadConfiguration) {
  return { webhookConfigured: Boolean(leadWebhook(cfg.webhookEnv)), webhookEnv: cfg.webhookEnv };
}

export async function createLead(input: LeadInput, meta: { userAgent?: string }) {
  const cfg = getLeadConfig(input.topic);
  if (!cfg) return { ok: false as const, error: "Nieznany temat zgłoszenia." };
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const consents = {
    contactConsent: input.contactConsent,
    privacyNoticeShown: true,
    disclosureShown: cfg.visibleDisclosure,
    at: createdAt,
    userAgent: meta.userAgent?.slice(0, 200),
  };
  getDb()
    .prepare(
      `INSERT INTO leads (id, created_at, topic, partner, instruction_slug, path_id, name, phone, email, context, consents_json, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'not_configured')`,
    )
    .run(
      id,
      createdAt,
      cfg.topic,
      cfg.partnerName,
      input.instructionSlug ?? null,
      input.pathId ?? null,
      input.name,
      input.phone,
      input.email ?? null,
      input.context ?? null,
      JSON.stringify(consents),
    );
  const forward = await forwardLead(id);
  return { ok: true as const, id, forwarded: forward.status === "forwarded" };
}

export function getLead(id: string): LeadRow | null {
  return (getDb().prepare("SELECT * FROM leads WHERE id = ?").get(id) as LeadRow | undefined) ?? null;
}

export function listLeads(limit = 200): LeadRow[] {
  return getDb().prepare("SELECT * FROM leads ORDER BY created_at DESC LIMIT ?").all(limit) as unknown as LeadRow[];
}

export function deleteLead(id: string) {
  getDb().prepare("DELETE FROM leads WHERE id = ?").run(id);
}

/** Przekazuje zgłoszenie do partnera. Zwraca status po próbie. */
export async function forwardLead(id: string, fetchImpl: typeof fetch = fetch): Promise<{ status: LeadStatus; error?: string }> {
  const lead = getLead(id);
  if (!lead) return { status: "failed", error: "Brak zgłoszenia" };
  const cfg = getLeadConfig(lead.topic);
  const url = cfg ? leadWebhook(cfg.webhookEnv) : null;
  const db = getDb();
  if (!cfg || !url) {
    db.prepare("UPDATE leads SET status = 'not_configured' WHERE id = ?").run(id);
    return { status: "not_configured" };
  }
  const payload = {
    id: lead.id,
    createdAt: lead.created_at,
    topic: lead.topic,
    partner: lead.partner,
    source: "instrukcjeprawne.pl",
    instruction: lead.instruction_slug,
    path: lead.path_id,
    contact: { name: lead.name, phone: lead.phone, email: lead.email },
    context: lead.context,
    consents: JSON.parse(lead.consents_json),
  };
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = { "content-type": "application/json", "x-ip-lead-id": lead.id };
  const secret = leadWebhookSecret();
  if (secret) headers["x-ip-signature"] = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
  try {
    const res = await fetchImpl(url, { method: "POST", headers, body, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    db.prepare("UPDATE leads SET status = 'forwarded', forward_attempts = forward_attempts + 1, last_error = NULL, forwarded_at = ? WHERE id = ?").run(
      new Date().toISOString(),
      id,
    );
    return { status: "forwarded" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    db.prepare("UPDATE leads SET status = 'failed', forward_attempts = forward_attempts + 1, last_error = ? WHERE id = ?").run(msg.slice(0, 300), id);
    return { status: "failed", error: msg };
  }
}
