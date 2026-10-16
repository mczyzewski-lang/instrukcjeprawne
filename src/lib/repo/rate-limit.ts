import "server-only";
import { createHash } from "node:crypto";
import { hashSalt } from "../config";
import { getDb } from "../db";

/** Prosty limit zdarzeń w oknie czasowym. Klucz (np. IP) jest haszowany – nie przechowujemy adresów IP. */
export function rateLimit(rawKey: string, limit: number, windowSeconds: number): boolean {
  const key = createHash("sha256").update(`${hashSalt()}:${rawKey}`).digest("hex");
  const now = Math.floor(Date.now() / 1000);
  const db = getDb();
  const row = db.prepare("SELECT window_start, count FROM rate_limits WHERE key = ?").get(key) as { window_start: number; count: number } | undefined;
  if (!row || now - row.window_start >= windowSeconds) {
    db.prepare("INSERT INTO rate_limits (key, window_start, count) VALUES (?, ?, 1) ON CONFLICT(key) DO UPDATE SET window_start = excluded.window_start, count = 1").run(
      key,
      now,
    );
    return true;
  }
  if (row.count >= limit) return false;
  db.prepare("UPDATE rate_limits SET count = count + 1 WHERE key = ?").run(key);
  return true;
}
