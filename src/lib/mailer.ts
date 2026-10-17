import "server-only";
import { mailConfig } from "./config";

export interface MailInput {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}

/** Wysyła e-mail przez Resend. Zwraca czytelny status do zapisania przy rozmowie. */
export async function sendMail(m: MailInput, fetchImpl: typeof fetch = fetch): Promise<{ ok: boolean; status: string }> {
  const cfg = mailConfig();
  if (!cfg.configured || !cfg.apiKey || !cfg.from) return { ok: false, status: "e-mail nieskonfigurowany (RESEND_API_KEY, MAIL_FROM)" };
  try {
    const res = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({ from: cfg.from, to: [m.to], subject: m.subject, text: m.text, ...(m.replyTo ? { reply_to: m.replyTo } : {}) }),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok ? { ok: true, status: `wysłano do ${m.to}` } : { ok: false, status: `błąd wysyłki (HTTP ${res.status})` };
  } catch (e) {
    return { ok: false, status: `błąd wysyłki (${e instanceof Error ? e.message : "?"})` };
  }
}
