import "server-only";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { showUnreviewed } from "../config";
import { dataDir, getDb } from "../db";
import type { CategorySlug, Expert, FoundersVideo } from "../types";

const photoDir = () => path.join(dataDir(), "experts");

export function listExperts(): Expert[] {
  return (getDb().prepare("SELECT json FROM experts ORDER BY rowid").all() as { json: string }[]).map((r) => JSON.parse(r.json));
}

export function getExpert(id: string): Expert | null {
  const r = getDb().prepare("SELECT json FROM experts WHERE id = ?").get(id) as { json: string } | undefined;
  return r ? JSON.parse(r.json) : null;
}

export function saveExpert(e: Expert) {
  getDb()
    .prepare("INSERT INTO experts (id, json, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET json = excluded.json, updated_at = excluded.updated_at")
    .run(e.id, JSON.stringify(e), new Date().toISOString());
}

export interface VisibleExpert {
  expert: Expert;
  /** dane do uzupełnienia – pokazywane tylko w trybie treści roboczych */
  placeholder: boolean;
}

/**
 * Ekspert dla instrukcji/kategorii widoczny publicznie:
 * - status „published” → zawsze,
 * - „draft” → tylko przy PUBLIC_SHOW_UNREVIEWED (z oznaczeniem „do uzupełnienia”).
 */
export function expertFor(category: CategorySlug, explicitId?: string | null): VisibleExpert | null {
  const all = listExperts();
  const e = (explicitId && all.find((x) => x.id === explicitId)) || all.find((x) => x.categories.includes(category));
  if (!e) return null;
  if (e.status === "published") return { expert: e, placeholder: false };
  return showUnreviewed() ? { expert: e, placeholder: true } : null;
}

const MIME_EXT = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export function saveExpertPhoto(id: string, data: Buffer, mime: string): { ok: true } | { ok: false; error: string } {
  const e = getExpert(id);
  if (!e) return { ok: false, error: "Nie znaleziono eksperta" };
  const ext = MIME_EXT.get(mime);
  if (!ext) return { ok: false, error: "Dozwolone formaty: JPG, PNG, WEBP." };
  if (data.length > 3 * 1024 * 1024) return { ok: false, error: "Maksymalny rozmiar zdjęcia to 3 MB." };
  mkdirSync(photoDir(), { recursive: true });
  const file = `${id}-${randomUUID().slice(0, 8)}.${ext}`;
  writeFileSync(path.join(photoDir(), file), data);
  saveExpert({ ...e, photoFile: file });
  return { ok: true };
}

export function readExpertPhoto(id: string): { data: Buffer; mime: string } | null {
  const e = getExpert(id);
  if (!e?.photoFile) return null;
  const file = path.join(photoDir(), path.basename(e.photoFile));
  if (!existsSync(file)) return null;
  const ext = path.extname(file).slice(1);
  const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  return { data: readFileSync(file), mime };
}

/* ---------- ustawienia (np. film założycieli) ---------- */

export function getSetting<T>(key: string): T | null {
  const r = getDb().prepare("SELECT json FROM settings WHERE key = ?").get(key) as { json: string } | undefined;
  return r ? (JSON.parse(r.json) as T) : null;
}

export function setSetting(key: string, value: unknown) {
  getDb()
    .prepare("INSERT INTO settings (key, json, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET json = excluded.json, updated_at = excluded.updated_at")
    .run(key, JSON.stringify(value), new Date().toISOString());
}

export function getFoundersVideo(): FoundersVideo | null {
  const v = getSetting<FoundersVideo>("founders_video");
  return v?.url ? v : null;
}
