import { resolve } from "./decision-engine";
import type { DecisionOutcome, Instruction, Path } from "./types";

/**
 * „Plan …” – osobisty plan działania budowany z kilku pytań i odpowiedzi:
 * sytuacja (sekcja A), drzewo decyzji, dokumenty, które już są, sposób działania, start, tempo i termin.
 * Wynik: podsumowanie sytuacji, rekomendowana droga z uzasadnieniem i harmonogram zadań z datami.
 * Nic nie jest zapisywane na serwerze – stan planu mieści się w krótkim kodzie (base64url),
 * z którego serwer odtwarza plan i PDF.
 */

export type PlanMode = "self" | "free" | "expert";
export type PlanStart = "now" | "week" | "next";

export interface PlanInput {
  /** odpowiedzi na pytania orientacyjne: id → 1 (tak) / 0 (nie) */
  s: Record<string, 0 | 1>;
  /** wybrane opcje drzewa decyzji */
  o: string[];
  /** wybrana droga */
  p: string;
  /** zrobione kroki, dokumenty, które już są, i odhaczone pozycje planu */
  d: string[];
  /** imię do planu (opcjonalnie) */
  n?: string;
  /** jak chcesz działać */
  m?: PlanMode;
  /** kiedy zaczynasz */
  t?: PlanStart;
  /** tempo: ile czasu w tygodniu (1 = ok. godzina, 2 = kilka godzin, 3 = więcej) */
  h?: 1 | 2 | 3;
  /** termin w sprawie (RRRR-MM-DD) */
  dl?: string;
  /** data przygotowania planu (RRRR-MM-DD) – daty w PDF są takie same jak na ekranie */
  g?: string;
}

export interface PlanItem {
  id: string;
  label: string;
  detail?: string;
  done: boolean;
  urgent?: boolean;
  /** sugerowana data wykonania (RRRR-MM-DD) */
  due?: string;
}

export interface PlanSection {
  id: string;
  title: string;
  items: PlanItem[];
}

export interface Plan {
  title: string;
  /** „Plan oddłużenia dla Ewy” */
  heading: string;
  instructionTitle: string;
  slug: string;
  pathId: string;
  pathName: string;
  /** dlaczego ta droga */
  reason: string;
  /** krótkie, osobiste podsumowanie sytuacji */
  summary: string[];
  situation: { question: string; answer: "Tak" | "Nie"; meaning: string }[];
  decisions: { question: string; answer: string }[];
  outcomes: Pick<DecisionOutcome, "id" | "title" | "description" | "urgent">[];
  uncertain: boolean;
  mode: PlanMode;
  startDate: string;
  endDate: string;
  deadline: { date: string; daysLeft: number } | null;
  sections: PlanSection[];
  total: number;
  doneCount: number;
}

export const planTitle = (ins: Pick<Instruction, "planName">) => `Plan ${ins.planName?.trim() || "działania"}`;

export const MODE_LABEL: Record<PlanMode, string> = {
  self: "Samodzielnie",
  free: "Z bezpłatną pomocą",
  expert: "Z ekspertem",
};

const ID_RE = /^[a-z0-9-]{1,80}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const NAME_RE = /^[\p{L}][\p{L} '-]{0,39}$/u;

export function encodePlan(input: PlanInput): string {
  const json = JSON.stringify(input);
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodePlan(code: string | null | undefined): PlanInput | null {
  if (!code || code.length > 4000 || !/^[A-Za-z0-9_-]+$/.test(code)) return null;
  try {
    const bin = atob(code.replace(/-/g, "+").replace(/_/g, "/"));
    const json = new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
    const raw = JSON.parse(json) as Partial<PlanInput>;
    const ids = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && ID_RE.test(x)).slice(0, 200) : []);
    const s: Record<string, 0 | 1> = {};
    if (raw.s && typeof raw.s === "object")
      for (const [k, v] of Object.entries(raw.s)) if (ID_RE.test(k) && (v === 0 || v === 1)) s[k] = v;
    const out: PlanInput = { s, o: ids(raw.o), p: typeof raw.p === "string" && ID_RE.test(raw.p) ? raw.p : "", d: ids(raw.d) };
    if (typeof raw.n === "string" && NAME_RE.test(raw.n.trim())) out.n = raw.n.trim();
    if (raw.m === "self" || raw.m === "free" || raw.m === "expert") out.m = raw.m;
    if (raw.t === "now" || raw.t === "week" || raw.t === "next") out.t = raw.t;
    if (raw.h === 1 || raw.h === 2 || raw.h === 3) out.h = raw.h;
    if (typeof raw.dl === "string" && DATE_RE.test(raw.dl) && !Number.isNaN(Date.parse(raw.dl))) out.dl = raw.dl;
    if (typeof raw.g === "string" && DATE_RE.test(raw.g) && !Number.isNaN(Date.parse(raw.g))) out.g = raw.g;
    return out;
  } catch {
    return null;
  }
}

/* ---------- daty (bez stref czasowych: liczymy na samych dniach) ---------- */

export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const toDays = (iso: string) => Math.floor(Date.parse(`${iso}T12:00:00Z`) / 86_400_000);
const fromDays = (n: number) => new Date(n * 86_400_000).toISOString().slice(0, 10);
export const formatPlDate = (iso: string) => iso.split("-").reverse().join(".");

/** Z drzewa i preferencji wybieramy drogę: wybraną przez użytkownika, jeśli pasuje do wyniku; inaczej najlepiej pasującą do trybu. */
function choosePath(ins: Instruction, input: PlanInput, outcomes: DecisionOutcome[]): Path {
  const suggested = outcomes.flatMap((o) => o.pathIds);
  const chosen = ins.paths.find((p) => p.id === input.p);
  if (chosen && (!suggested.length || suggested.includes(chosen.id))) return chosen;
  const candidates = suggested.map((id) => ins.paths.find((p) => p.id === id)).filter((p): p is Path => Boolean(p));
  // przy działaniu samodzielnym albo z bezpłatną pomocą – najpierw drogi, które nie wymagają eksperta
  if (input.m === "self" || input.m === "free") {
    const own = candidates.find((p) => p.kind === "self" || p.kind === "free-help" || p.kind === "negotiation" || p.kind === "check");
    if (own) return own;
  }
  return candidates[0] ?? chosen ?? ins.paths[0];
}

export function buildPlan(ins: Instruction, input: PlanInput): Plan {
  const tree = resolve(ins.decisionTree, input.o);
  const outcomes = tree.complete ? tree.outcomes : [];
  const path = choosePath(ins, input, outcomes);
  const done = new Set(input.d);
  const nodes = new Map(ins.decisionTree.nodes.map((n) => [n.id, n]));
  const mode: PlanMode = input.m ?? "self";
  const title = planTitle(ins);

  const situation = ins.situationQuestions
    .filter((q) => input.s[q.id] !== undefined)
    .map((q) => ({ question: q.question, answer: input.s[q.id] ? ("Tak" as const) : ("Nie" as const), meaning: input.s[q.id] ? q.ifYes : q.ifNo }));
  const decisions = tree.answers.map((a) => {
    const n = nodes.get(a.nodeId)!;
    return { question: n.question, answer: n.options.find((o) => o.id === a.optionId)?.label ?? "" };
  });

  /* ---------- harmonogram ---------- */
  const today = input.g ?? todayIso();
  const startOffset = input.t === "week" ? 2 : input.t === "next" ? 7 : 0;
  const start = toDays(today) + startOffset;
  const deadlineDays = input.dl ? toDays(input.dl) : null;
  const perWeek = input.h === 3 ? 7 : input.h === 2 ? 4 : 2;
  const gap = Math.max(1, Math.round(7 / perWeek));
  let cursor = start;
  /** kolejne zadanie w rytmie tempa; nigdy po terminie w sprawie */
  const nextDue = (urgent = false) => {
    let d = urgent ? Math.min(start, toDays(today) + 1) : cursor;
    if (!urgent) cursor += gap;
    if (deadlineDays !== null && d >= deadlineDays) d = Math.max(toDays(today), deadlineDays - 1);
    return fromDays(d);
  };

  const item = (id: string, label: string, detail?: string, urgent?: boolean, due?: string): PlanItem => ({ id, label, detail, done: done.has(id), urgent, due });
  const sections: PlanSection[] = [];

  /* 1. pilne */
  const urgentItems: PlanItem[] = [];
  if (deadlineDays !== null)
    urgentItems.push(item("termin", `Twój termin: ${formatPlDate(input.dl!)}`, "Zaplanuj wszystkie pilne kroki tak, żeby zdążyć przed tą datą. Jeśli termin wynika z pisma z sądu lub od komornika, sprawdź w pouczeniu, od kiedy się go liczy.", true, nextDue(true)));
  urgentItems.push(...outcomes.filter((o) => o.urgent).map((o) => item(`pilne-${o.id}`, o.title, o.description, true, nextDue(true))));
  urgentItems.push(...(ins.urgent?.items ?? []).map((t, i) => item(`pilne-${i + 1}`, t, undefined, true, nextDue(true))));
  if (urgentItems.length) sections.push({ id: "pilne", title: "Najpierw – sprawy pilne", items: urgentItems });

  /* 2. dokumenty, których jeszcze nie ma */
  const missingDocs = path.documents.filter((d) => !done.has(d.id));
  const haveDocs = path.documents.filter((d) => done.has(d.id));
  const docsDue = nextDue();
  if (path.documents.length)
    sections.push({
      id: "dokumenty",
      title: missingDocs.length ? `Zbierz brakujące dokumenty (${missingDocs.length})` : "Dokumenty – masz już wszystko",
      items: [...missingDocs.map((d) => item(d.id, d.label, d.hint, false, docsDue)), ...haveDocs.map((d) => item(d.id, d.label, "Masz już ten dokument.", false))],
    });

  /* 3. sposób działania */
  const modeItems: PlanItem[] = [];
  if (mode === "free") {
    for (const [i, h] of ins.freeHelp.slice(0, 3).entries())
      modeItems.push(item(`bezplatnie-${i + 1}`, `Umów bezpłatną pomoc: ${h.name}`, [h.description, h.phone && `tel. ${h.phone}`, h.url].filter(Boolean).join(" · "), false, i === 0 ? nextDue() : undefined));
    modeItems.push(item("bezplatnie-plan", "Weź ten plan na spotkanie", "Wydrukuj go albo zapisz jako PDF – łatwiej będzie opisać sprawę.", false));
  }
  if (mode === "expert") modeItems.push(item("ekspert", "Omów plan bezpłatnie z ekspertem", "Dołącz ten plan do czatu – ekspert zobaczy Twoje odpowiedzi i wybraną drogę.", false, nextDue()));
  if (modeItems.length) sections.push({ id: "pomoc", title: mode === "free" ? "Bezpłatna pomoc w Twojej sprawie" : "Rozmowa z ekspertem", items: modeItems });

  /* 4. kroki drogi */
  sections.push({
    id: "kroki",
    title: `Kroki: ${path.name}`,
    items: [
      item(`start-${path.id}`, `Pierwszy krok: ${path.firstStep}`, undefined, false, nextDue()),
      ...path.steps.map((s) => item(s.id, s.title, s.warning ? `${s.explanation} Uwaga: ${s.warning}` : s.explanation, false, nextDue())),
    ],
  });

  /* 5. ostrzeżenia */
  if (ins.warnings.length) sections.push({ id: "uwaga", title: "Sprawdź, czy tego unikasz", items: ins.warnings.map((w) => item(w.id, w.title, w.body, w.severity === "urgent")) });

  /* 6. inne drogi z wyniku */
  const otherPaths = [...new Set(outcomes.flatMap((o) => o.pathIds))]
    .filter((id) => id !== path.id)
    .map((id) => ins.paths.find((p) => p.id === id))
    .filter((p): p is Path => Boolean(p));
  if (otherPaths.length) sections.push({ id: "inne", title: "Inne drogi warte sprawdzenia", items: otherPaths.map((p) => item(`droga-${p.id}`, p.name, `${p.summary} Pierwszy krok: ${p.firstStep}`)) });

  if (tree.uncertain || !tree.complete)
    sections.push({
      id: "do-ustalenia",
      title: "Do ustalenia",
      items: [item("ustal-nie-wiem", tree.complete ? "Uzupełnij informacje, przy których wybrano „nie wiem”." : "Odpowiedz na pytania z drzewa decyzji – plan będzie dokładniejszy.", "Wróć do pytań i popraw odpowiedzi – plan zaktualizuje się automatycznie.")],
    });

  /* ---------- podsumowanie ---------- */
  const reasonOutcome = outcomes.find((o) => o.pathIds.includes(path.id));
  const reason = reasonOutcome
    ? `${reasonOutcome.title}. ${reasonOutcome.description}`
    : input.p === path.id
      ? `Wybrana przez Ciebie droga. ${path.summary}`
      : path.summary;
  const summary = [
    ...situation.map((s) => s.meaning),
    ...outcomes.filter((o) => o.urgent).map((o) => `Pilne: ${o.title}.`),
    haveDocs.length || missingDocs.length ? `Dokumenty: masz ${haveDocs.length} z ${path.documents.length}.` : "",
    `Sposób działania: ${MODE_LABEL[mode].toLowerCase()}.`,
  ].filter(Boolean);

  const all = sections.flatMap((s) => s.items);
  const dues = all.map((i) => i.due).filter((d): d is string => Boolean(d)).sort();
  return {
    title,
    heading: input.n ? `${title} – ${input.n}` : title,
    instructionTitle: ins.title,
    slug: ins.slug,
    pathId: path.id,
    pathName: path.name,
    reason,
    summary,
    situation,
    decisions,
    outcomes: outcomes.map(({ id, title: t, description, urgent }) => ({ id, title: t, description, urgent })),
    uncertain: tree.uncertain,
    mode,
    startDate: fromDays(start),
    endDate: dues[dues.length - 1] ?? fromDays(start),
    deadline: deadlineDays !== null ? { date: input.dl!, daysLeft: deadlineDays - toDays(today) } : null,
    sections,
    total: all.length,
    doneCount: all.filter((i) => i.done).length,
  };
}

export const planPdfHref = (slug: string, code: string) => `/instrukcje/${slug}/plan?d=${code}`;
