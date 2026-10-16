import type { DecisionNode, DecisionOption, DecisionOutcome, DecisionTree } from "./types";

/**
 * Silnik drzew decyzji – czyste funkcje, bez zależności od Reacta.
 * Drzewo jest konfigurowane danymi (DecisionTree), a stan to lista wybranych opcji.
 *
 * Silnik NIE wydaje oceny prawnej: zbiera wyniki („drogi warte sprawdzenia”)
 * i oznacza, kiedy odpowiedzi są niepełne.
 */

export interface DecisionAnswer {
  nodeId: string;
  optionId: string;
}

export interface DecisionResolution {
  /** bieżące pytanie (gdy drzewo nie jest ukończone) */
  node: DecisionNode | null;
  answers: DecisionAnswer[];
  complete: boolean;
  outcomes: DecisionOutcome[];
  /** użytkownik wybrał co najmniej jedną odpowiedź typu „nie wiem” */
  uncertain: boolean;
  progress: { answered: number; total: number };
}

function nodeMap(tree: DecisionTree) {
  return new Map(tree.nodes.map((n) => [n.id, n]));
}

/** Najdłuższa liczba pytań od danego węzła do końca (z ochroną przed cyklami). */
export function remainingDepth(tree: DecisionTree, nodeId: string, seen = new Set<string>()): number {
  if (seen.has(nodeId)) return 0;
  const node = nodeMap(tree).get(nodeId);
  if (!node) return 0;
  const nextSeen = new Set(seen).add(nodeId);
  let max = 0;
  for (const opt of node.options) {
    if (opt.nextNodeId) max = Math.max(max, remainingDepth(tree, opt.nextNodeId, nextSeen));
  }
  return 1 + max;
}

/**
 * Odtwarza przejście przez drzewo na podstawie listy id opcji.
 * Nieprawidłowe lub nadmiarowe id są ignorowane (np. zmieniony link po aktualizacji drzewa).
 */
export function resolve(tree: DecisionTree, optionIds: string[]): DecisionResolution {
  const nodes = nodeMap(tree);
  const answers: DecisionAnswer[] = [];
  const collected: string[] = [];
  let uncertain = false;
  let current: DecisionNode | undefined = nodes.get(tree.startNodeId);
  let complete = false;

  for (const optionId of optionIds) {
    if (!current) break;
    const option: DecisionOption | undefined = current.options.find((o) => o.id === optionId);
    if (!option) break;
    answers.push({ nodeId: current.id, optionId: option.id });
    if (option.uncertain) uncertain = true;
    for (const id of option.outcomeIds ?? []) if (!collected.includes(id)) collected.push(id);
    if (option.nextNodeId && nodes.has(option.nextNodeId)) {
      current = nodes.get(option.nextNodeId);
    } else {
      current = undefined;
      complete = true;
    }
  }

  const outcomeById = new Map(tree.outcomes.map((o) => [o.id, o]));
  const outcomes = collected
    .map((id) => outcomeById.get(id))
    .filter((o): o is DecisionOutcome => Boolean(o))
    .sort((a, b) => {
      if (Boolean(a.urgent) !== Boolean(b.urgent)) return a.urgent ? -1 : 1;
      return (a.priority ?? 50) - (b.priority ?? 50);
    });

  const remaining = current ? remainingDepth(tree, current.id) : 0;
  return {
    node: complete ? null : current ?? null,
    answers,
    complete,
    outcomes,
    uncertain,
    progress: { answered: answers.length, total: answers.length + remaining },
  };
}

/** Kodowanie odpowiedzi do parametru URL (udostępnianie wyniku). */
export function encodeAnswers(optionIds: string[]): string {
  return optionIds.map(encodeURIComponent).join(".");
}

export function decodeAnswers(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(".")
    .map((v) => {
      try {
        return decodeURIComponent(v);
      } catch {
        return "";
      }
    })
    .filter((v) => /^[a-z0-9-]{1,64}$/i.test(v))
    .slice(0, 20);
}

/** Walidacja spójności drzewa – używana przy zapisie w CMS i w testach treści. */
export function validateTree(tree: DecisionTree, knownPathIds?: string[]): string[] {
  const errors: string[] = [];
  const nodeIds = new Set<string>();
  const optionIds = new Set<string>();
  for (const n of tree.nodes) {
    if (nodeIds.has(n.id)) errors.push(`Powtórzone id pytania: ${n.id}`);
    nodeIds.add(n.id);
  }
  const outcomeIds = new Set(tree.outcomes.map((o) => o.id));
  if (!nodeIds.has(tree.startNodeId)) errors.push(`Brak pytania startowego: ${tree.startNodeId}`);

  for (const n of tree.nodes) {
    if (n.options.length < 2) errors.push(`Pytanie ${n.id} ma mniej niż 2 odpowiedzi`);
    for (const o of n.options) {
      if (optionIds.has(o.id)) errors.push(`Powtórzone id odpowiedzi: ${o.id}`);
      optionIds.add(o.id);
      if (o.nextNodeId && !nodeIds.has(o.nextNodeId)) errors.push(`Odpowiedź ${o.id} prowadzi do nieistniejącego pytania ${o.nextNodeId}`);
      for (const oc of o.outcomeIds ?? []) if (!outcomeIds.has(oc)) errors.push(`Odpowiedź ${o.id} wskazuje nieistniejący wynik ${oc}`);
    }
  }

  // każde zakończenie musi dawać przynajmniej jeden wynik
  const walk = (nodeId: string, acc: string[], seen: Set<string>) => {
    if (seen.has(nodeId)) {
      errors.push(`Cykl w drzewie przy pytaniu ${nodeId}`);
      return;
    }
    const node = tree.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    for (const o of node.options) {
      const nextAcc = [...acc, ...(o.outcomeIds ?? [])];
      if (o.nextNodeId) walk(o.nextNodeId, nextAcc, new Set(seen).add(nodeId));
      else if (nextAcc.length === 0) errors.push(`Ścieżka kończąca się odpowiedzią ${o.id} nie daje żadnego wyniku`);
    }
  };
  if (nodeIds.has(tree.startNodeId)) walk(tree.startNodeId, [], new Set());

  if (knownPathIds) {
    for (const oc of tree.outcomes)
      for (const p of oc.pathIds) if (!knownPathIds.includes(p)) errors.push(`Wynik ${oc.id} wskazuje nieistniejącą ścieżkę ${p}`);
  }
  return [...new Set(errors)];
}
