import type { CategorySlug, Question, SourceReference, VideoPlatform } from "./types";

/** Parser CSV (RFC 4180): cudzysłowy, przecinki/średniki, nowe linie w polach, BOM. */
export function parseCsv(input: string): string[][] {
  const text = input.replace(/^﻿/, "");
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const delim = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"' && field === "") quoted = true;
    else if (c === delim) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim() !== "")) rows.push(row);
  return rows;
}

const esc = (v: string) => (/[",;\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export function toCsv(rows: (string | number | null | undefined)[][]): string {
  return "﻿" + rows.map((r) => r.map((v) => esc(v == null ? "" : String(v))).join(",")).join("\r\n") + "\r\n";
}

export const QUESTION_CSV_COLUMNS = [
  "slug",
  "title",
  "category",
  "answer",
  "actions",
  "explanation",
  "relatedInstruction",
  "relatedPath",
  "relatedQuestions",
  "priority",
  "sourceTitle",
  "sourceUrl",
  "sourcePublisher",
  "videoPlatform",
  "videoUrl",
  "videoTitle",
  "videoTranscript",
] as const;

const CATS: CategorySlug[] = ["dlugi-i-komornik", "firma-w-trudnosciach", "podatki-przedsiebiorcy", "ochrona-marki", "rozwod-i-rodzina", "kredyty-i-banki", "umowy-i-konsumenci", "inne-sprawy"];

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 100);
}

const list = (v: string | undefined) =>
  (v ?? "")
    .split("|")
    .map((x) => x.trim())
    .filter(Boolean);

export interface CsvImportRow {
  line: number;
  question?: Question;
  errors: string[];
}

/**
 * Zamienia CSV na pytania. Importowane pytania zawsze trafiają jako szkic („draft”) –
 * publikacja wymaga przeglądu w panelu. Pola wielowartościowe rozdzielamy znakiem „|”.
 */
export function questionsFromCsv(input: string, today = new Date().toISOString().slice(0, 10)): CsvImportRow[] {
  const rows = parseCsv(input);
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  const idx = (name: string) => header.indexOf(name);
  if (idx("title") === -1 || idx("category") === -1) return [{ line: 1, errors: ["Brak wymaganych kolumn: title, category"] }];
  return rows.slice(1).map((r, i) => {
    const get = (name: string) => {
      const k = idx(name);
      return k === -1 ? undefined : r[k]?.trim() || undefined;
    };
    const errors: string[] = [];
    const title = get("title") ?? "";
    const category = get("category") as CategorySlug | undefined;
    const slug = get("slug") ?? slugify(title);
    if (title.length < 5) errors.push("Tytuł jest za krótki");
    if (!category || !CATS.includes(category)) errors.push(`Nieznana kategoria: ${category ?? "(brak)"}`);
    if (!/^[a-z0-9-]{3,120}$/.test(slug)) errors.push("Niepoprawny slug");
    const sources: SourceReference[] = [];
    if (get("sourceUrl")) {
      try {
        new URL(get("sourceUrl")!);
        sources.push({
          id: `src-${slugify(get("sourceTitle") ?? get("sourceUrl")!).slice(0, 40) || "1"}`,
          title: get("sourceTitle") ?? get("sourceUrl")!,
          publisher: get("sourcePublisher") ?? new URL(get("sourceUrl")!).hostname,
          url: get("sourceUrl")!,
          verifiedAt: today,
          confidence: "unverified",
        });
      } catch {
        errors.push("Niepoprawny URL źródła");
      }
    }
    const platform = get("videoPlatform") as VideoPlatform | undefined;
    const priority = get("priority");
    const q: Question = {
      id: `q-${slug}`,
      slug,
      title,
      category: (category ?? "inne-sprawy") as CategorySlug,
      answer: get("answer") ?? "",
      actions: list(get("actions")),
      explanation: get("explanation"),
      sourceReferences: sources,
      relatedInstruction: get("relatedInstruction") ?? null,
      relatedPath: get("relatedPath") ?? null,
      relatedQuestions: list(get("relatedQuestions")),
      relatedVideo:
        get("videoUrl") && platform
          ? { platform, url: get("videoUrl")!, title: get("videoTitle") ?? title, transcript: get("videoTranscript") }
          : null,
      status: "draft",
      aiAssisted: false,
      legalReviewedAt: null,
      updatedAt: today,
      priority: priority === "high" || priority === "medium" || priority === "low" ? priority : undefined,
      editorialNote: "Zaimportowano z CSV",
    };
    if (q.relatedVideo && !["own", "instagram", "tiktok", "youtube"].includes(q.relatedVideo.platform)) errors.push("Nieznana platforma wideo");
    return { line: i + 2, question: errors.length ? undefined : q, errors };
  });
}

export function questionsToCsv(qs: Question[]): string {
  return toCsv([
    [...QUESTION_CSV_COLUMNS, "status"],
    ...qs.map((q) => [
      q.slug,
      q.title,
      q.category,
      q.answer,
      q.actions.join(" | "),
      q.explanation ?? "",
      q.relatedInstruction ?? "",
      q.relatedPath ?? "",
      q.relatedQuestions.join(" | "),
      q.priority ?? "",
      q.sourceReferences[0]?.title ?? "",
      q.sourceReferences[0]?.url ?? "",
      q.sourceReferences[0]?.publisher ?? "",
      q.relatedVideo?.platform ?? "",
      q.relatedVideo?.url ?? "",
      q.relatedVideo?.title ?? "",
      q.relatedVideo?.transcript ?? "",
      q.status,
    ]),
  ]);
}
