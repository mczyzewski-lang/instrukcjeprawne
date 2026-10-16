import { describe, expect, it } from "vitest";
import { SEED_INSTRUCTIONS } from "@/content";
import { decodeAnswers, encodeAnswers, resolve, validateTree } from "@/lib/decision-engine";

const tree = SEED_INSTRUCTIONS.find((i) => i.slug === "jak-wyjsc-z-dlugow")!.decisionTree;

describe("silnik drzew decyzji", () => {
  it("startuje od pierwszego pytania", () => {
    const r = resolve(tree, []);
    expect(r.node?.id).toBe(tree.startNodeId);
    expect(r.complete).toBe(false);
    expect(r.progress.answered).toBe(0);
    expect(r.progress.total).toBeGreaterThan(1);
  });

  it("zbiera wiele wyników i stawia pilne na początku", () => {
    const r = resolve(tree, ["o-pismo-sad", "o-czesc", "o-firma-nie", "o-pewne-nie"]);
    expect(r.complete).toBe(true);
    expect(r.outcomes[0].urgent).toBe(true);
    const ids = r.outcomes.map((o) => o.id);
    expect(ids).toEqual(expect.arrayContaining(["r-terminy", "r-negocjacje", "r-uklad", "r-weryfikacja", "r-pomoc"]));
    expect(r.outcomes.length).toBeGreaterThan(1);
  });

  it("oznacza wynik niepewny przy odpowiedzi „nie wiem”", () => {
    const r = resolve(tree, ["o-zaleglosci", "o-nie-wiem-splata", "o-firma-nie", "o-pewne-tak"]);
    expect(r.uncertain).toBe(true);
  });

  it("kończy wcześniej, gdy odpowiedź nie ma kolejnego pytania", () => {
    const r = resolve(tree, ["o-zaleglosci", "o-nic", "o-firma-tak"]);
    expect(r.complete).toBe(true);
    expect(r.outcomes.find((o) => o.id === "r-firma")?.instructionSlug).toBe("jak-wyjsc-z-dlugow-firmowych");
  });

  it("ignoruje nieprawidłowe odpowiedzi z linku", () => {
    const r = resolve(tree, ["o-zaleglosci", "nie-istnieje", "o-czesc"]);
    expect(r.answers).toHaveLength(1);
  });

  it("koduje i dekoduje odpowiedzi do URL", () => {
    const ids = ["o-pismo-sad", "o-czesc"];
    expect(decodeAnswers(encodeAnswers(ids))).toEqual(ids);
    expect(decodeAnswers("<script>.o-czesc")).toEqual(["o-czesc"]);
  });

  it("wszystkie drzewa w treściach są spójne", () => {
    for (const i of SEED_INSTRUCTIONS) expect(validateTree(i.decisionTree, i.paths.map((p) => p.id)), i.slug).toEqual([]);
  });

  it("wykrywa błędy w drzewie", () => {
    const errors = validateTree({
      id: "t",
      title: "t",
      intro: "t",
      startNodeId: "a",
      nodes: [{ id: "a", question: "q", options: [{ id: "x", label: "x", nextNodeId: "brak" }, { id: "y", label: "y" }] }],
      outcomes: [],
    });
    expect(errors.some((e) => e.includes("nieistniejącego pytania"))).toBe(true);
    expect(errors.some((e) => e.includes("nie daje żadnego wyniku"))).toBe(true);
  });
});
