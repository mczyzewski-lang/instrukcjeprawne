import { resolve } from "./decision-engine";
import type { DecisionOutcome, FreeHelpResource, Instruction, Path } from "./types";

/**
 * „Plan …” – osobisty plan działania budowany z kilku pytań i odpowiedzi.
 *
 * Układ (wartość planu jasna od pierwszego ekranu):
 *  1. cel – co możesz osiągnąć tą drogą,
 *  2. gdzie jesteś teraz (z odpowiedzi) i ile kosztuje zwlekanie,
 *  3. pierwsze ruchy na dziś,
 *  4. etapy z datami: zabezpiecz terminy → zbierz dokumenty → działaj,
 *  5. czego unikać,
 *  6. na końcu zawsze wybór: samodzielnie / z bezpłatną pomocą / z ekspertem.
 *
 * Nic nie jest zapisywane na serwerze – stan planu mieści się w krótkim kodzie (base64url),
 * z którego serwer odtwarza plan i PDF.
 */

export type PlanStart = "now" | "week" | "next";
/** czy w sprawie biegnie termin: tak (z datą) / nie / nie wiem */
export type PlanDeadlineStatus = "yes" | "no" | "unknown";

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
  /** kiedy zaczynasz */
  t?: PlanStart;
  /** czy biegnie termin */
  ds?: PlanDeadlineStatus;
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
  /** „Etap 1” itp. */
  kicker?: string;
  title: string;
  /** po co ten etap */
  why?: string;
  items: PlanItem[];
}

export interface Plan {
  title: string;
  /** „Plan oddłużenia – Ewa” */
  heading: string;
  instructionTitle: string;
  slug: string;
  /** data przygotowania planu (RRRR-MM-DD) */
  createdAt: string;
  pathId: string;
  pathName: string;
  /** cel – co daje ta droga */
  goal: string;
  /** dlaczego ta droga */
  reason: string;
  /** gdzie jesteś teraz – z odpowiedzi */
  now: string[];
  /** co jeszcze możesz zyskać (poza celem) */
  gains: string[];
  /** ile kosztuje zwlekanie */
  costOfWaiting: string[];
  /** id pierwszych ruchów (z etapów), do zrobienia od razu */
  quickWinIds: string[];
  situation: { question: string; answer: "Tak" | "Nie"; meaning: string }[];
  decisions: { question: string; answer: string }[];
  outcomes: Pick<DecisionOutcome, "id" | "title" | "description" | "urgent">[];
  uncertain: boolean;
  startDate: string;
  endDate: string;
  deadline: { date: string; daysLeft: number } | null;
  deadlineStatus: PlanDeadlineStatus;
  sections: PlanSection[];
  freeHelp: FreeHelpResource[];
  total: number;
  doneCount: number;
}

export const planTitle = (ins: Pick<Instruction, "planName">) => `Plan ${ins.planName?.trim() || "działania"}`;

/** Co dostajesz w bezpłatnej rozmowie z ekspertem – bez obietnic wyniku. */
export const EXPERT_VALUE = [
  "Ekspert przejrzy ten plan razem z Twoimi odpowiedziami – nie musisz opowiadać wszystkiego od nowa.",
  "Sprawdzi, czy dobrze liczysz terminy i od czego zacząć w Twojej sytuacji.",
  "Powie, czy wybrana droga ma sens, i odpowie na pytania, których plan nie rozstrzygnie.",
];

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
    if (raw.t === "now" || raw.t === "week" || raw.t === "next") out.t = raw.t;
    if (raw.ds === "yes" || raw.ds === "no" || raw.ds === "unknown") out.ds = raw.ds;
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

/** Droga: wybrana przez użytkownika, jeśli pasuje do wyniku drzewa (albo drzewa nie ukończono); inaczej najważniejsza z wyniku. */
function choosePath(ins: Instruction, input: PlanInput, outcomes: DecisionOutcome[]): Path {
  const suggested = outcomes.flatMap((o) => o.pathIds);
  const chosen = ins.paths.find((p) => p.id === input.p);
  if (chosen && (!suggested.length || suggested.includes(chosen.id))) return chosen;
  return ins.paths.find((p) => p.id === suggested[0]) ?? chosen ?? ins.paths[0];
}

/** domyślnie zadanie co 2 dni; przy terminie – gęściej, żeby wszystko zmieściło się przed nim */
const DEFAULT_GAP = 2;

export function buildPlan(ins: Instruction, input: PlanInput): Plan {
  const tree = resolve(ins.decisionTree, input.o);
  const outcomes = tree.complete ? tree.outcomes : [];
  const path = choosePath(ins, input, outcomes);
  const done = new Set(input.d);
  const nodes = new Map(ins.decisionTree.nodes.map((n) => [n.id, n]));
  const title = planTitle(ins);
  const deadlineStatus: PlanDeadlineStatus = input.dl ? "yes" : (input.ds ?? "no");

  const situation = ins.situationQuestions
    .filter((q) => input.s[q.id] !== undefined)
    .map((q) => ({ question: q.question, answer: input.s[q.id] ? ("Tak" as const) : ("Nie" as const), meaning: input.s[q.id] ? q.ifYes : q.ifNo }));
  const decisions = tree.answers.map((a) => {
    const n = nodes.get(a.nodeId)!;
    return { question: n.question, answer: n.options.find((o) => o.id === a.optionId)?.label ?? "" };
  });

  const item = (id: string, label: string, detail?: string, urgent?: boolean): PlanItem => ({ id, label, detail, done: done.has(id), urgent });

  /* ---------- etapy ---------- */
  const sections: PlanSection[] = [];

  const urgentItems: PlanItem[] = [];
  if (input.dl)
    urgentItems.push(
      item(
        "termin",
        `Twój termin: ${formatPlDate(input.dl)}`,
        "To ostatni dzień na działanie w sprawie. Wszystkie pilne zadania z planu mają daty przed nim. Jeśli termin wynika z pisma, sprawdź w pouczeniu, od kiedy się go liczy – zwykle od dnia odebrania pisma.",
        true,
      ),
    );
  if (deadlineStatus === "unknown")
    urgentItems.push(
      item(
        "ustal-termin",
        "Ustal, czy w sprawie biegnie termin",
        "Przeczytaj pouczenie w piśmie (zwykle na końcu) albo zapytaj w sądzie, urzędzie lub u nadawcy pisma. Zapisz datę odebrania pisma – od niej najczęściej liczy się termin.",
        true,
      ),
    );
  urgentItems.push(...outcomes.filter((o) => o.urgent).map((o) => item(`pilne-${o.id}`, o.title, o.description, true)));
  urgentItems.push(...(ins.urgent?.items ?? []).map((t, i) => item(`pilne-${i + 1}`, t, undefined, true)));
  if (urgentItems.length)
    sections.push({ id: "pilne", kicker: `Etap ${sections.length + 1}`, title: "Zabezpiecz terminy", why: "Najpierw to, czego nie da się nadrobić później.", items: urgentItems });

  const missingDocs = path.documents.filter((d) => !done.has(d.id));
  const haveDocs = path.documents.filter((d) => done.has(d.id));
  if (path.documents.length)
    sections.push({
      id: "dokumenty",
      kicker: `Etap ${sections.length + 1}`,
      title: missingDocs.length ? `Zbierz brakujące dokumenty (${missingDocs.length})` : "Dokumenty – masz już wszystko",
      why: "Z kompletem papierów każdy kolejny krok idzie szybciej – także rozmowa z ekspertem.",
      items: [...missingDocs.map((d) => item(d.id, d.label, d.hint)), ...haveDocs.map((d) => item(d.id, d.label, "Masz już ten dokument."))],
    });

  sections.push({
    id: "kroki",
    kicker: `Etap ${sections.length + 1}`,
    title: `Działaj: ${path.name}`,
    why: path.summary,
    items: [item(`start-${path.id}`, `Pierwszy krok: ${path.firstStep}`), ...path.steps.map((s) => item(s.id, s.title, s.warning ? `${s.explanation} Uwaga: ${s.warning}` : s.explanation))],
  });

  if (ins.warnings.length) sections.push({ id: "uwaga", title: "Czego unikać", why: "Najczęstsze błędy, które kosztują najwięcej.", items: ins.warnings.map((w) => item(w.id, w.title, w.body, w.severity === "urgent")) });

  const otherPaths = [...new Set(outcomes.flatMap((o) => o.pathIds))]
    .filter((id) => id !== path.id)
    .map((id) => ins.paths.find((p) => p.id === id))
    .filter((p): p is Path => Boolean(p));
  if (otherPaths.length) sections.push({ id: "inne", title: "Plan B – inne drogi warte sprawdzenia", items: otherPaths.map((p) => item(`droga-${p.id}`, p.name, `${p.summary} Pierwszy krok: ${p.firstStep}`)) });

  if (tree.uncertain || !tree.complete)
    sections.push({
      id: "do-ustalenia",
      title: "Do ustalenia",
      items: [item("ustal-nie-wiem", tree.complete ? "Uzupełnij informacje, przy których wybrano „nie wiem”." : "Odpowiedz na pytania z drzewa decyzji – plan będzie dokładniejszy.", "Kliknij „Zmień odpowiedzi” – plan zaktualizuje się automatycznie.")],
    });

  /* ---------- harmonogram ---------- */
  const today = toDays(input.g ?? todayIso());
  const start = today + (input.t === "week" ? 2 : input.t === "next" ? 7 : 0);
  const deadlineDays = input.dl ? toDays(input.dl) : null;
  const scheduled = sections.filter((s) => s.id === "dokumenty" || s.id === "kroki").flatMap((s) => s.items.filter((i) => !i.done));
  const room = deadlineDays !== null ? Math.max(0, deadlineDays - 1 - start) : Infinity;
  const gap = scheduled.length > 1 ? Math.min(DEFAULT_GAP, room / (scheduled.length - 1)) : DEFAULT_GAP;
  for (const s of sections) if (s.id === "pilne") for (const i of s.items) i.due = fromDays(Math.min(today + (i.id === "termin" ? 0 : 1), deadlineDays ?? Infinity));
  // brakujące dokumenty zbierasz razem – jedna data dla etapu
  const docsDue = fromDays(start);
  scheduled.forEach((i, idx) => {
    const isDoc = sections.find((s) => s.id === "dokumenty")?.items.includes(i);
    const d = isDoc ? docsDue : fromDays(Math.floor(start + 1 + idx * gap));
    i.due = deadlineDays !== null && d >= fromDays(deadlineDays) ? fromDays(Math.max(today, deadlineDays - 1)) : d;
  });

  /* ---------- podsumowanie ---------- */
  const reasonOutcome = outcomes.find((o) => o.pathIds.includes(path.id));
  const reason = reasonOutcome ? `${reasonOutcome.title}. ${reasonOutcome.description}` : input.p === path.id ? `Wybrana przez Ciebie droga. ${path.summary}` : path.summary;
  const now = [
    ...situation.map((s) => s.meaning),
    ...outcomes.filter((o) => o.urgent).map((o) => `Pilne: ${o.title}.`),
    path.documents.length ? `Dokumenty: masz ${haveDocs.length} z ${path.documents.length}.` : "",
    input.dl ? `Termin: ${formatPlDate(input.dl)}.` : deadlineStatus === "unknown" ? "Nie wiesz jeszcze, czy biegnie termin – to sprawdzisz najpierw." : "",
  ].filter(Boolean);
  const costOfWaiting = [
    ...ins.warnings.filter((w) => w.severity === "urgent").map((w) => `${w.title}: ${w.body}`),
    ...path.risks,
  ].slice(0, 3);

  const all = sections.flatMap((s) => s.items);
  const firstUndone = (id: string) => sections.find((s) => s.id === id)?.items.find((i) => !i.done)?.id;
  const quickWinIds = [firstUndone("pilne"), `start-${path.id}`, firstUndone("dokumenty")].filter((x): x is string => Boolean(x) && !done.has(x!));
  const dues = all.map((i) => i.due).filter((d): d is string => Boolean(d)).sort();

  return {
    title,
    heading: input.n ? `${title} – ${input.n}` : title,
    instructionTitle: ins.title,
    slug: ins.slug,
    createdAt: fromDays(today),
    pathId: path.id,
    pathName: path.name,
    goal: path.benefits[0] ?? ins.shortDescription,
    reason,
    now,
    gains: path.benefits.slice(1),
    costOfWaiting,
    quickWinIds: [...new Set(quickWinIds)],
    situation,
    decisions,
    outcomes: outcomes.map(({ id, title: t, description, urgent }) => ({ id, title: t, description, urgent })),
    uncertain: tree.uncertain,
    startDate: fromDays(start),
    endDate: dues[dues.length - 1] ?? fromDays(start),
    deadline: deadlineDays !== null ? { date: input.dl!, daysLeft: deadlineDays - today } : null,
    deadlineStatus,
    sections,
    freeHelp: ins.freeHelp,
    total: all.length,
    doneCount: all.filter((i) => i.done).length,
  };
}

/** nazwa pliku planu, np. „Plan rozwodu – Marek (17.10.26)” */
export const planFileTitle = (plan: Pick<Plan, "heading" | "createdAt">) => {
  const [y, m, d] = plan.createdAt.split("-");
  return `${plan.heading} (${d}.${m}.${y.slice(2)})`;
};

export const planPdfHref = (slug: string, code: string) => `/instrukcje/${slug}/plan?d=${code}`;
