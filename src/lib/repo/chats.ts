import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mailConfig, siteUrl, smsAfterMinutes, smsConfig } from "../config";
import { getDb } from "../db";
import { sendMail } from "../mailer";
import { buildPlan, decodePlan, planPdfHref } from "../plan";
import type { Instruction } from "../types";
import type { ChatStartInput, EmailMessageInput } from "../schemas";
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
  channel: "chat" | "email";
  subject: string | null;
  mail_status: string | null;
}

/** Załącznik wiadomości – na razie „Plan …” (PDF generowany z kodu odpowiedzi). */
export interface ChatAttachment {
  type: "plan";
  title: string;
  href: string;
  summary?: string;
}

export interface ChatMessage {
  id: number;
  author: "user" | "expert" | "system";
  author_name: string | null;
  body: string;
  created_at: string;
  attachment: ChatAttachment | null;
}

const hash = (t: string) => createHash("sha256").update(t).digest("hex");

interface StartMeta {
  expertId?: string | null;
  expertName?: string;
  /** adres, na który powiadamiamy eksperta o nowej wiadomości */
  expertEmail?: string | null;
  instructionTitle?: string;
  userAgent?: string;
  /** zweryfikowany „Plan …” dołączony do pierwszej wiadomości */
  attachment?: ChatAttachment | null;
}

type ThreadInput = Omit<ChatStartInput, "phone"> & { phone?: string; subject?: string };

async function createThread(channel: "chat" | "email", input: ThreadInput, meta: StartMeta) {
  const cfg = getLeadConfig(input.topic);
  if (!cfg) return { ok: false as const, error: "Nieznany temat rozmowy." };
  const id = randomUUID();
  const token = randomBytes(24).toString("base64url");
  const now = new Date().toISOString();
  const phone = input.phone ? `${input.phonePrefix}${input.phone}` : "";
  const adminLink = `${siteUrl()}/admin/czaty/${id}`;
  const label = channel === "chat" ? "Czat z ekspertem" : "Wiadomość e-mail do eksperta";
  // zgłoszenie dla partnera (webhook) – z linkiem do rozmowy w panelu
  const lead = await createLead(
    {
      name: input.name,
      phone,
      email: input.email,
      topic: input.topic,
      instructionSlug: input.instructionSlug,
      pathId: input.pathId,
      context: `${label}${meta.instructionTitle ? ` · ${meta.instructionTitle}` : ""} · ${adminLink}`.slice(0, 400),
      contactConsent: true,
      startedAt: input.startedAt,
    },
    { userAgent: meta.userAgent },
  );
  getDb()
    .prepare(
      `INSERT INTO chats (id, token_hash, created_at, updated_at, topic, partner, expert_id, instruction_slug, path_id, name, email, phone, marketing_consent, lead_id, user_seen_at, channel, subject)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
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
      channel,
      input.subject ?? null,
    );
  addMessage(id, "user", input.name, input.message, meta.attachment);

  // powiadomienie eksperta e-mailem (odpowiedź „Odpowiedz” trafia wprost do użytkownika przy wiadomości e-mail)
  const to = meta.expertEmail || mailConfig().fallbackTo;
  const notice = to
    ? await sendMail({
        to,
        subject: `${label}: ${input.subject ?? meta.instructionTitle ?? cfg.topic}`,
        replyTo: channel === "email" ? input.email : undefined,
        text: [
          `${label} od: ${input.name} <${input.email}>${phone ? `, tel. ${phone}` : ""}`,
          meta.instructionTitle ? `Instrukcja: ${meta.instructionTitle}` : "",
          "",
          input.message,
          "",
          meta.attachment ? `Załącznik: ${meta.attachment.title} – ${siteUrl()}${meta.attachment.href}` : "",
          `Odpowiedz w panelu: ${adminLink}`,
        ]
          .filter((l, i) => l || i > 1)
          .join("\n"),
      })
    : { ok: false, status: "brak adresu eksperta (e-mail w /admin/eksperci)" };
  getDb().prepare("UPDATE chats SET mail_status = ? WHERE id = ?").run(`powiadomienie eksperta: ${notice.status}`, id);
  return { ok: true as const, id, token };
}

/** Rozpoczęcie czatu. Bez automatycznych wiadomości – w oknie widać tylko to, co piszą ludzie. */
export function startChat(input: ChatStartInput, meta: StartMeta) {
  return createThread("chat", input, meta);
}

/** Wiadomość e-mail wysłana formularzem na stronie. Odpowiedź eksperta wychodzi e-mailem do użytkownika. */
export function sendEmailMessage(input: EmailMessageInput, meta: StartMeta) {
  return createThread("email", input, meta);
}

export function addMessage(chatId: string, author: ChatMessage["author"], authorName: string | null, body: string, attachment?: ChatAttachment | null) {
  const now = new Date().toISOString();
  getDb()
    .prepare("INSERT INTO chat_messages (chat_id, author, author_name, body, created_at, attachment) VALUES (?, ?, ?, ?, ?, ?)")
    .run(chatId, author, authorName, body, now, attachment ? JSON.stringify(attachment) : null);
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
  const rows = getDb()
    .prepare("SELECT id, author, author_name, body, created_at, attachment FROM chat_messages WHERE chat_id = ? AND id > ? ORDER BY id")
    .all(chatId, afterId) as unknown as (Omit<ChatMessage, "attachment"> & { attachment: string | null })[];
  return rows.map((r) => ({ ...r, attachment: r.attachment ? (JSON.parse(r.attachment) as ChatAttachment) : null }));
}

/** Weryfikuje kod planu względem instrukcji i buduje załącznik (tytuł i link do PDF ustala serwer). */
export function planAttachment(ins: Instruction | null | undefined, code: string | undefined): ChatAttachment | null {
  if (!ins || !code) return null;
  const input = decodePlan(code);
  if (!input) return null;
  const plan = buildPlan(ins, input);
  return { type: "plan", title: plan.title, href: planPdfHref(ins.slug, code), summary: `${plan.pathName} · ${plan.doneCount} z ${plan.total} zrobione` };
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
 * Odpowiedź eksperta.
 * - wiadomość e-mail: odpowiedź wychodzi e-mailem do użytkownika (o ile skonfigurowano wysyłkę),
 * - czat: jeśli użytkownika nie było na stronie od SMS_AFTER_MINUTES minut – SMS (o ile skonfigurowano bramkę).
 *   Token rozmowy nie jest przechowywany jawnie, więc SMS zawiera link do instrukcji – rozmowa otworzy się na urządzeniu użytkownika.
 */
export async function expertReply(chatId: string, authorName: string, body: string, fetchImpl: typeof fetch = fetch): Promise<{ notice: string }> {
  const c = getChat(chatId);
  if (!c) return { notice: "brak rozmowy" };
  addMessage(chatId, "expert", authorName, body);
  markSeen(chatId, "admin");
  if (c.channel === "email") {
    const r = await sendMail(
      {
        to: c.email,
        subject: `Re: ${c.subject ?? "Twoja wiadomość"} – InstrukcjePrawne.pl`,
        replyTo: mailConfig().fallbackTo ?? undefined,
        text: `${body}\n\n${authorName}\nInstrukcjePrawne.pl`,
      },
      fetchImpl,
    );
    const notice = r.ok ? `e-mail ${r.status}` : `${r.status} – odpowiedz ze swojej skrzynki`;
    getDb().prepare("UPDATE chats SET mail_status = ? WHERE id = ?").run(notice, chatId);
    return { notice };
  }
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
  return { notice: `SMS: ${sms}` };
}
