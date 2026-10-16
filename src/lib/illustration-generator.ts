import "server-only";
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { openAiConfig } from "./config";
import { dataDir, getDb } from "./db";

/**
 * IllustrationGenerator – serwerowy moduł generowania ilustracji instruktażowych przez API OpenAI.
 *
 * - Klucz API wyłącznie z env (OPENAI_API_KEY), nigdy w przeglądarce.
 * - Model konfigurowalny (OPENAI_IMAGE_MODEL), domyślnie gpt-image-2. Endpoint: POST /v1/images/generations.
 * - Wygenerowana grafika trafia do kolejki „pending” – NIE jest publikowana bez zatwierdzenia.
 * - Zapisujemy prompt, wersję promptu i model (pochodzenie).
 * - Pliki są cache'owane na dysku; strona nigdy nie generuje grafik przy wyświetlaniu.
 * - Bez klucza API strona korzysta z biblioteki własnych SVG.
 */

export const PROMPT_VERSION = "v1-2026-10";

export const BASE_PROMPT =
  "Create a minimalist, original flat 2D instructional diagram inspired by the clarity of technical assembly manuals. " +
  "Use clean navy line art on a pure white background with a tiny muted gold accent if necessary. " +
  "Consistent stroke width, simple human figures, clearly recognizable objects, no shading, no gradients, no photorealism, " +
  "no decorative details, no lettering or embedded text. Show one precise action: [ACTION]. Focus on explaining the action as clearly as possible.";

export function buildPrompt(action: string): string {
  const clean = action.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 400);
  return BASE_PROMPT.replace("[ACTION]", clean);
}

export type IllustrationStatus = "pending" | "approved" | "rejected" | "manual" | "replaced" | "failed";

export interface IllustrationRow {
  id: string;
  target_key: string;
  status: IllustrationStatus;
  source: "openai" | "upload";
  prompt: string | null;
  prompt_version: string | null;
  model: string | null;
  file_name: string | null;
  mime: string | null;
  alt: string;
  created_at: string;
  reviewed_at: string | null;
  error: string | null;
}

const illDir = () => path.join(dataDir(), "illustrations");

export function stepTargetKey(instructionId: string, stepId: string) {
  return `step:${instructionId}:${stepId}`;
}

export function listIllustrations(targetKey?: string): IllustrationRow[] {
  const db = getDb();
  return (
    targetKey
      ? db.prepare("SELECT * FROM illustrations WHERE target_key = ? ORDER BY created_at DESC").all(targetKey)
      : db.prepare("SELECT * FROM illustrations ORDER BY created_at DESC LIMIT 300").all()
  ) as unknown as IllustrationRow[];
}

/** Zatwierdzone grafiki (approved/manual) dla danych celów – do renderowania stron. */
export function approvedIllustrations(prefix: string): Map<string, { id: string; alt: string }> {
  const rows = getDb()
    .prepare("SELECT id, target_key, alt FROM illustrations WHERE target_key LIKE ? AND status IN ('approved','manual') ORDER BY created_at DESC")
    .all(`${prefix}%`) as { id: string; target_key: string; alt: string }[];
  const map = new Map<string, { id: string; alt: string }>();
  for (const r of rows) if (!map.has(r.target_key)) map.set(r.target_key, { id: r.id, alt: r.alt });
  return map;
}

export function readIllustrationFile(id: string): { data: Buffer; mime: string } | null {
  const row = getDb().prepare("SELECT file_name, mime FROM illustrations WHERE id = ?").get(id) as { file_name: string | null; mime: string | null } | undefined;
  if (!row?.file_name) return null;
  const file = path.join(illDir(), path.basename(row.file_name));
  if (!existsSync(file)) return null;
  return { data: readFileSync(file), mime: row.mime || "image/png" };
}

function supersede(targetKey: string, exceptId: string) {
  getDb()
    .prepare("UPDATE illustrations SET status = 'replaced' WHERE target_key = ? AND id != ? AND status IN ('approved','manual')")
    .run(targetKey, exceptId);
}

export function setIllustrationStatus(id: string, status: "approved" | "rejected") {
  const row = getDb().prepare("SELECT target_key FROM illustrations WHERE id = ?").get(id) as { target_key: string } | undefined;
  if (!row) return false;
  getDb().prepare("UPDATE illustrations SET status = ?, reviewed_at = ? WHERE id = ?").run(status, new Date().toISOString(), id);
  if (status === "approved") supersede(row.target_key, id);
  return true;
}

export function updateIllustrationAlt(id: string, alt: string) {
  getDb().prepare("UPDATE illustrations SET alt = ? WHERE id = ?").run(alt.slice(0, 300), id);
}

const ALLOWED_UPLOAD = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
]);

/** Ręczna podmiana grafiki (upload przez administratora). Zatwierdzona od razu, bo dodał ją człowiek. */
export function saveUploadedIllustration(targetKey: string, data: Buffer, mime: string, alt: string): { ok: true; id: string } | { ok: false; error: string } {
  const ext = ALLOWED_UPLOAD.get(mime);
  if (!ext) return { ok: false, error: "Dozwolone formaty: PNG, JPG, WEBP." };
  if (data.length > 4 * 1024 * 1024) return { ok: false, error: "Maksymalny rozmiar pliku to 4 MB." };
  if (!alt.trim()) return { ok: false, error: "Tekst alternatywny jest wymagany." };
  const id = randomUUID();
  mkdirSync(illDir(), { recursive: true });
  const fileName = `${id}.${ext}`;
  writeFileSync(path.join(illDir(), fileName), data);
  getDb()
    .prepare("INSERT INTO illustrations (id, target_key, status, source, file_name, mime, alt, created_at, reviewed_at) VALUES (?, ?, 'manual', 'upload', ?, ?, ?, ?, ?)")
    .run(id, targetKey, fileName, mime, alt.trim(), new Date().toISOString(), new Date().toISOString());
  supersede(targetKey, id);
  return { ok: true, id };
}

/**
 * Generuje grafikę i zapisuje ją jako „pending”. Jeśli dla tego samego celu i promptu
 * istnieje już grafika (pending/approved), zwraca ją zamiast generować ponownie – chyba że force.
 */
export async function generateIllustration(
  targetKey: string,
  action: string,
  alt: string,
  opts: { force?: boolean; fetchImpl?: typeof fetch } = {},
): Promise<{ ok: true; id: string; cached: boolean } | { ok: false; error: string }> {
  const cfg = openAiConfig();
  if (!cfg.configured || !cfg.apiKey) return { ok: false, error: "OPENAI_API_KEY nie jest skonfigurowany. Strona używa biblioteki SVG." };
  const prompt = buildPrompt(action);
  const db = getDb();
  if (!opts.force) {
    const existing = db
      .prepare("SELECT id FROM illustrations WHERE target_key = ? AND prompt = ? AND model = ? AND status IN ('pending','approved') ORDER BY created_at DESC LIMIT 1")
      .get(targetKey, prompt, cfg.model) as { id: string } | undefined;
    if (existing) return { ok: true, id: existing.id, cached: true };
  }
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const doFetch = opts.fetchImpl ?? fetch;
  try {
    const res = await doFetch(`${cfg.baseUrl}/images/generations`, {
      method: "POST",
      headers: { authorization: `Bearer ${cfg.apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({ model: cfg.model, prompt, size: cfg.size, quality: cfg.quality, n: 1 }),
      signal: AbortSignal.timeout(120_000),
    });
    const json = (await res.json().catch(() => ({}))) as { data?: { b64_json?: string; url?: string }[]; error?: { message?: string } };
    if (!res.ok) throw new Error(json.error?.message || `HTTP ${res.status}`);
    const item = json.data?.[0];
    let buf: Buffer | null = null;
    if (item?.b64_json) buf = Buffer.from(item.b64_json, "base64");
    else if (item?.url) {
      const img = await doFetch(item.url, { signal: AbortSignal.timeout(60_000) });
      buf = Buffer.from(await img.arrayBuffer());
    }
    if (!buf) throw new Error("API nie zwróciło obrazu");
    mkdirSync(illDir(), { recursive: true });
    const fileName = `${id}.png`;
    writeFileSync(path.join(illDir(), fileName), buf);
    db.prepare(
      "INSERT INTO illustrations (id, target_key, status, source, prompt, prompt_version, model, file_name, mime, alt, created_at) VALUES (?, ?, 'pending', 'openai', ?, ?, ?, ?, 'image/png', ?, ?)",
    ).run(id, targetKey, prompt, PROMPT_VERSION, cfg.model, fileName, alt, createdAt);
    return { ok: true, id, cached: false };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    db.prepare(
      "INSERT INTO illustrations (id, target_key, status, source, prompt, prompt_version, model, alt, created_at, error) VALUES (?, ?, 'failed', 'openai', ?, ?, ?, ?, ?, ?)",
    ).run(id, targetKey, prompt, PROMPT_VERSION, cfg.model, alt, createdAt, msg.slice(0, 500));
    return { ok: false, error: msg };
  }
}
