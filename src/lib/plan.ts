import { resolve } from "./decision-engine";
import type { DecisionOutcome, Instruction } from "./types";

/**
 * „Plan …” – osobista checklista złożona z odpowiedzi użytkownika (sekcja A i drzewo decyzji),
 * wybranej drogi, jej kroków, dokumentów i ostrzeżeń. Nic nie jest zapisywane na serwerze:
 * stan planu mieści się w krótkim kodzie (base64url), z którego serwer odtwarza plan i PDF.
 */

export interface PlanInput {
  /** odpowiedzi na pytania orientacyjne: id → 1 (tak) / 0 (nie) */
  s: Record<string, 0 | 1>;
  /** wybrane opcje drzewa decyzji */
  o: string[];
  /** wybrana droga */
  p: string;
  /** zrobione kroki i zaznaczone dokumenty / pozycje planu */
  d: string[];
}

export interface PlanItem {
  id: string;
  label: string;
  detail?: string;
  done: boolean;
  urgent?: boolean;
}

export interface PlanSection {
  id: string;
  title: string;
  items: PlanItem[];
}

export interface Plan {
  title: string;
  instructionTitle: string;
  slug: string;
  pathId: string;
  pathName: string;
  situation: { question: string; answer: "Tak" | "Nie"; meaning: string }[];
  decisions: { question: string; answer: string }[];
  outcomes: Pick<DecisionOutcome, "id" | "title" | "description" | "urgent">[];
  uncertain: boolean;
  sections: PlanSection[];
  total: number;
  doneCount: number;
}

export const planTitle = (ins: Pick<Instruction, "planName">) => `Plan ${ins.planName?.trim() || "działania"}`;

const ID_RE = /^[a-z0-9-]{1,80}$/;

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
    return { s, o: ids(raw.o), p: typeof raw.p === "string" && ID_RE.test(raw.p) ? raw.p : "", d: ids(raw.d) };
  } catch {
    return null;
  }
}

/** Droga planu: wybrana przez użytkownika, jeśli pasuje do wyniku drzewa (albo drzewa nie ukończono); inaczej najważniejsza z wyniku. */
function choosePath(ins: Instruction, input: PlanInput, outcomes: DecisionOutcome[]) {
  const suggested = outcomes.flatMap((o) => o.pathIds);
  const chosen = ins.paths.find((p) => p.id === input.p);
  if (chosen && (!suggested.length || suggested.includes(chosen.id))) return chosen;
  return ins.paths.find((p) => p.id === suggested[0]) ?? chosen ?? ins.paths[0];
}

export function buildPlan(ins: Instruction, input: PlanInput): Plan {
  const tree = resolve(ins.decisionTree, input.o);
  const outcomes = tree.complete ? tree.outcomes : [];
  const path = choosePath(ins, input, outcomes);
  const done = new Set(input.d);
  const nodes = new Map(ins.decisionTree.nodes.map((n) => [n.id, n]));

  const situation = ins.situationQuestions
    .filter((q) => input.s[q.id] !== undefined)
    .map((q) => ({ question: q.question, answer: input.s[q.id] ? ("Tak" as const) : ("Nie" as const), meaning: input.s[q.id] ? q.ifYes : q.ifNo }));
  const decisions = tree.answers.map((a) => {
    const n = nodes.get(a.nodeId)!;
    return { question: n.question, answer: n.options.find((o) => o.id === a.optionId)?.label ?? "" };
  });

  const item = (id: string, label: string, detail?: string, urgent?: boolean): PlanItem => ({ id, label, detail, done: done.has(id), urgent });
  const sections: PlanSection[] = [];

  const urgentItems = [
    ...outcomes.filter((o) => o.urgent).map((o) => item(`pilne-${o.id}`, o.title, o.description, true)),
    ...(ins.urgent?.items ?? []).map((t, i) => item(`pilne-${i + 1}`, t, undefined, true)),
  ];
  if (urgentItems.length) sections.push({ id: "pilne", title: "Najpierw – sprawy pilne", items: urgentItems });

  sections.push({
    id: "kroki",
    title: `Kroki: ${path.name}`,
    items: [item(`start-${path.id}`, `Pierwszy krok: ${path.firstStep}`), ...path.steps.map((s) => item(s.id, s.title, s.warning ? `${s.explanation} Uwaga: ${s.warning}` : s.explanation))],
  });

  if (path.documents.length) sections.push({ id: "dokumenty", title: "Dokumenty do przygotowania", items: path.documents.map((d) => item(d.id, d.label, d.hint)) });

  if (ins.warnings.length)
    sections.push({ id: "uwaga", title: "Sprawdź, czy tego unikasz", items: ins.warnings.map((w) => item(w.id, w.title, w.body, w.severity === "urgent")) });

  const others = [...new Set(outcomes.flatMap((o) => o.pathIds))].filter((id) => id !== path.id);
  const otherPaths = others.map((id) => ins.paths.find((p) => p.id === id)).filter((p) => p !== undefined);
  if (otherPaths.length)
    sections.push({ id: "inne", title: "Inne drogi warte sprawdzenia", items: otherPaths.map((p) => item(`droga-${p.id}`, p.name, `${p.summary} Pierwszy krok: ${p.firstStep}`)) });

  if (tree.uncertain)
    sections.push({ id: "do-ustalenia", title: "Do ustalenia", items: [item("ustal-nie-wiem", "Uzupełnij informacje, przy których wybrano „nie wiem” – wynik drzewa decyzji jest niepełny.")] });

  const all = sections.flatMap((s) => s.items);
  return {
    title: planTitle(ins),
    instructionTitle: ins.title,
    slug: ins.slug,
    pathId: path.id,
    pathName: path.name,
    situation,
    decisions,
    outcomes: outcomes.map(({ id, title, description, urgent }) => ({ id, title, description, urgent })),
    uncertain: tree.uncertain,
    sections,
    total: all.length,
    doneCount: all.filter((i) => i.done).length,
  };
}

export const planPdfHref = (slug: string, code: string) => `/instrukcje/${slug}/plan?d=${code}`;
