import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { siteUrl, smsAfterMinutes, smsConfig } from "../config";
import { getDb } from "../db";
import type { ChatStartInput } from "../schemas";
import { createLead, getLeadConfig } from "./leads";

/**
 * Czat z ekspertem.
 * - Użytkownik podaje imię, e-mail, telefon i pierwszą wiadomość; dostaje tajny token rozmowy (trzymany w przeglądarce).
 * - Odpowiedzi pisze człowiek w panelu (/admin/czaty). Nie ma automatycznych odpowiedzi udających eksperta.
 * - Rozmowa tworzy też zgłoszenie (lead), żeby trafiła do właściwego partnera przez skonfigurowany webhook.
 * - Gdy ekspert odpowie, a użytkownika nie ma już na stronie, wysyłamy SMS – tylko jeśli skonfigurowano bramkę SMS.
 */

export interface ChatRow {
  id: string;
  token_hash: string;
  created_at: string;
  updated_at: string;
  topic: string;
  partner: string;
  expert_id: string | null;
  instruction_slug: string | null;
  path_id: string | null;
  name: string;
  email: string;
  phone: string;
  marketing_consent: number;
  status: "open" | "closed";
  lead_id: string | null;
  user_seen_at: string | null;
  admin_seen_at: string | null;
  sms_status: string | null;
}

export interface ChatMessage {
  id: number;
  author: "user" | "expert" | "system";
  author_name: string | null;
  body: string;
  created_at: string;
}

const hash = (t: string) => createHash("sha256").update(t).digest("hex");

export async function startChat(input: ChatStartInput, meta: { expertId?: string | null; expertName?: string; instructionTitle?: string; userAgent?: string }) {
  const cfg = getLeadConfig(input.topic);
  if (!cfg) return { ok: false as const, error: "Nieznany temat rozmowy." };
  const id = randomUUID();
  const token = randomBytes(24).toString("base64url");
  const now = new Date().toISOString();
  const phone = `${input.phonePrefix}${input.phone}`;
  const db = getDb();
  // zgłoszenie dla partnera (webhook) – z linkiem do rozmowy w panelu
  const lead = await createLead(
    {
      name: input.name,
      phone,
      email: input.email,
      topic: input.topic,
      instructionSlug: input.instructionSlug,
      pathId: input.pathId,
      context: `Czat z ekspertem${meta.instructionTitle ? ` · ${meta.instructionTitle}` : ""} · ${siteUrl()}/admin/czaty/${id}`.slice(0, 400),
      contactConsent: true,
      startedAt: input.startedAt,
    },
    { userAgent: meta.userAgent },
  );
  db.prepare(
    `INSERT INTO chats (id, token_hash, created_at, updated_at, topic, partner, expert_id, instruction_slug, path_id, name, email, phone, marketing_consent, lead_id, user_seen_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    hash(token),
    now,
    now,
    cfg.topic,
    cfg.partnerName,
    meta.expertId ?? null,
    input.instructionSlug ?? null,
    input.pathId ?? null,
    input.name,
    input.email,
    phone,
    input.marketingConsent ? 1 : 0,
    lead.ok ? lead.id : null,
    now,
  );
  addMessage(id, "user", input.name, input.message);
  addMessage(
    id,
    "system",
    null,
    `Wiadomość trafiła do: ${meta.expertName ?? "eksperta"}. Odpowiedź pojawi się w tym oknie. Jeśli zamkniesz stronę, a odpowiedź przyjdzie później, damy Ci znać SMS-em.`,
  );
  return { ok: true as const, id, token };
}

export function addMessage(chatId: string, author: ChatMessage["author"], authorName: string | null, body: string) {
  const now = new Date().toISOString();
  getDb().prepare("INSERT INTO chat_messages (chat_id, author, author_name, body, created_at) VALUES (?, ?, ?, ?, ?)").run(chatId, author, authorName, body, now);
  getDb().prepare("UPDATE chats SET updated_at = ? WHERE id = ?").run(now, chatId);
}

export function getChat(id: string): ChatRow | null {
  return (getDb().prepare("SELECT * FROM chats WHERE id = ?").get(id) as ChatRow | undefined) ?? null;
}

export function verifyChatToken(id: string, token: string): ChatRow | null {
  const c = getChat(id);
  if (!c) return null;
  const a = Buffer.from(c.token_hash);
  const b = Buffer.from(hash(token));
  return a.length === b.length && a.equals(b) ? c : null;
}

export function listMessages(chatId: string, afterId = 0): ChatMessage[] {
  return getDb().prepare("SELECT id, author, author_name, body, created_at FROM chat_messages WHERE chat_id = ? AND id > ? ORDER BY id").all(chatId, afterId) as unknown as ChatMessage[];
}

export function markSeen(chatId: string, who: "user" | "admin") {
  getDb().prepare(`UPDATE chats SET ${who === "user" ? "user_seen_at" : "admin_seen_at"} = ? WHERE id = ?`).run(new Date().toISOString(), chatId);
}

export interface ChatListItem extends ChatRow {
  last_body: string | null;
  last_author: string | null;
  messages: number;
}

export function listChats(limit = 200): ChatListItem[] {
  return getDb()
    .prepare(
      `SELECT c.*, (SELECT body FROM chat_messages m WHERE m.chat_id = c.id AND m.author != 'system' ORDER BY id DESC LIMIT 1) last_body,
              (SELECT author FROM chat_messages m WHERE m.chat_id = c.id AND m.author != 'system' ORDER BY id DESC LIMIT 1) last_author,
              (SELECT COUNT(*) FROM chat_messages m WHERE m.chat_id = c.id) messages
       FROM chats c ORDER BY c.updated_at DESC LIMIT ?`,
    )
    .all(limit) as unknown as ChatListItem[];
}

export function setChatStatus(id: string, status: "open" | "closed") {
  getDb().prepare("UPDATE chats SET status = ? WHERE id = ?").run(status, id);
}

export function deleteChat(id: string) {
  getDb().prepare("DELETE FROM chat_messages WHERE chat_id = ?").run(id);
  getDb().prepare("DELETE FROM chats WHERE id = ?").run(id);
}

/**
 * Odpowiedź eksperta. Jeśli użytkownika nie było na stronie od SMS_AFTER_MINUTES minut – SMS (o ile skonfigurowano bramkę).
 * Token rozmowy nie jest przechowywany jawnie, więc SMS zawiera link do instrukcji – rozmowa otworzy się na urządzeniu użytkownika.
 */
export async function expertReply(chatId: string, authorName: string, body: string, fetchImpl: typeof fetch = fetch): Promise<{ sms: string }> {
  const c = getChat(chatId);
  if (!c) return { sms: "brak rozmowy" };
  addMessage(chatId, "expert", authorName, body);
  markSeen(chatId, "admin");
  const seen = c.user_seen_at ? Date.parse(c.user_seen_at) : 0;
  const away = Date.now() - seen > smsAfterMinutes() * 60_000;
  let sms = "nie było potrzeby (użytkownik jest na stronie)";
  if (away) {
    const cfg = smsConfig();
    if (!cfg.configured || !cfg.url) sms = "SMS nieskonfigurowane – skontaktuj się telefonicznie lub e-mailem";
    else {
      const link = `${siteUrl()}/instrukcje/${c.instruction_slug ?? ""}#pomoc`;
      try {
        const res = await fetchImpl(cfg.url, {
          method: "POST",
          headers: { "content-type": "application/json", ...(cfg.token ? { authorization: `Bearer ${cfg.token}` } : {}) },
          body: JSON.stringify({ to: c.phone, message: `InstrukcjePrawne.pl: ekspert odpowiedział na Twoje pytanie. Odpowiedź zobaczysz na stronie: ${link}` }),
          signal: AbortSignal.timeout(8000),
        });
        sms = res.ok ? `wysłano ${new Date().toISOString().slice(0, 16).replace("T", " ")}` : `błąd bramki (HTTP ${res.status})`;
      } catch (e) {
        sms = `błąd bramki (${e instanceof Error ? e.message : "?"})`;
      }
    }
  }
  getDb().prepare("UPDATE chats SET sms_status = ? WHERE id = ?").run(sms, chatId);
  return { sms };
}
