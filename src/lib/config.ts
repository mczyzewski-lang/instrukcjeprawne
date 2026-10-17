/**
 * Konfiguracja z zmiennych środowiskowych. Brak kluczy = działający tryb lokalny
 * z jasnymi komunikatami, a nie udawanie, że integracja działa.
 */

export const SITE_NAME = "InstrukcjePrawne.pl";
export const SITE_TAGLINE = "Proste instrukcje na trudne sprawy";

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

/**
 * Czy pokazywać publicznie treści „do zatwierdzenia” (przygotowane z pomocą AI, przed weryfikacją prawnika).
 * Domyślnie TAK w trybie lokalnym – z widocznym oznaczeniem i noindex.
 * Przed startem produkcyjnym ustaw PUBLIC_SHOW_UNREVIEWED=false i zatwierdź treści w panelu.
 */
export function showUnreviewed(): boolean {
  return (process.env.PUBLIC_SHOW_UNREVIEWED ?? "true") !== "false";
}

export function isProduction() {
  return process.env.NODE_ENV === "production";
}

export const DEV_ADMIN_PASSWORD = "admin-lokalnie";

/** Hasło administratora. W produkcji wymagane; lokalnie – hasło deweloperskie. */
export function adminPassword(): string | null {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  return isProduction() ? null : DEV_ADMIN_PASSWORD;
}

export function sessionSecret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (isProduction() && process.env.ADMIN_PASSWORD) {
    // bez osobnego sekretu podpisujemy sesję pochodną hasła – działa, ale zalecany jest osobny sekret
    return `pw:${process.env.ADMIN_PASSWORD}:instrukcjeprawne`;
  }
  return "dev-only-secret-change-me-dev-only-secret";
}

export function openAiConfig() {
  const key = process.env.OPENAI_API_KEY;
  return {
    configured: Boolean(key),
    apiKey: key ?? null,
    model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2",
    size: process.env.OPENAI_IMAGE_SIZE || "1536x1024",
    quality: process.env.OPENAI_IMAGE_QUALITY || "medium",
    baseUrl: (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, ""),
  };
}

export function leadWebhook(envName: string): string | null {
  const v = process.env[envName];
  if (!v) return null;
  try {
    const u = new URL(v);
    if (u.protocol !== "https:" && !(u.protocol === "http:" && !isProduction())) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function leadWebhookSecret(): string | null {
  return process.env.LEAD_WEBHOOK_SECRET || null;
}

/** Sól do anonimizacji (np. hash IP przy limitach). */
export function hashSalt(): string {
  return process.env.HASH_SALT || "instrukcjeprawne-local-salt";
}

export const LEGAL_ENTITY = {
  operator: process.env.NEXT_PUBLIC_OPERATOR_NAME || "[Uzupełnij: nazwa operatora serwisu]",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "[Uzupełnij: e-mail kontaktowy]",
};

/** Bramka SMS (np. własny endpoint dostawcy). POST JSON { to, message }. Brak = SMS nieskonfigurowane. */
export function smsConfig() {
  const url = process.env.SMS_WEBHOOK_URL;
  return { configured: Boolean(url), url: url ?? null, token: process.env.SMS_WEBHOOK_TOKEN ?? null };
}

/**
 * Wysyłka e-maili (powiadomienia dla eksperta, odpowiedzi na wiadomości z formularza).
 * Obsługiwany dostawca: Resend (RESEND_API_KEY + MAIL_FROM ze zweryfikowanej domeny).
 * Brak = wiadomości zapisują się w panelu (/admin/czaty), ale nie wychodzą e-mailem.
 */
export function mailConfig() {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  const fallbackTo = process.env.MAIL_NOTIFY_TO || process.env.NEXT_PUBLIC_CONTACT_EMAIL || null;
  return { configured: Boolean(key && from), apiKey: key ?? null, from: from ?? null, fallbackTo };
}

/** Po ilu minutach bez odpowiedzi eksperta wysyłamy SMS (gdy użytkownik nie jest już na stronie). */
export function smsAfterMinutes(): number {
  const v = Number(process.env.SMS_AFTER_MINUTES);
  return Number.isFinite(v) && v > 0 ? v : 5;
}
