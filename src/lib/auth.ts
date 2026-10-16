import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminPassword, isProduction, sessionSecret } from "./config";

/**
 * Dostęp do panelu: jedno hasło administratora (ADMIN_PASSWORD) + podpisana sesja (HMAC) w ciasteczku httpOnly.
 * Ciasteczko jest „niezbędne” (zabezpieczenie panelu) – nie wymaga zgody.
 */

export const SESSION_COOKIE = "ip_admin";
const SESSION_HOURS = 12;

interface Session {
  name: string;
  exp: number;
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function createSessionToken(name: string, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ name, exp: now + SESSION_HOURS * 3600_000 } satisfies Session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined, now = Date.now()): Session | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const s = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
    if (typeof s.exp !== "number" || s.exp < now) return null;
    return s;
  } catch {
    return null;
  }
}

export function checkPassword(input: string): boolean {
  const expected = adminPassword();
  if (!expected) return false;
  const a = createHmac("sha256", "cmp").update(input).digest();
  const b = createHmac("sha256", "cmp").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export async function requireAdmin(): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/admin/login");
  return s;
}

export async function setSession(name: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(name), {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
