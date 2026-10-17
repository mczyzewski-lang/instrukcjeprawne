import { describe, expect, it } from "vitest";
import { SEED_INSTRUCTIONS } from "@/content";
import { buildPlan, decodePlan, encodePlan, planTitle } from "@/lib/plan";

const ins = SEED_INSTRUCTIONS.find((i) => i.slug === "co-zrobic-gdy-komornik-zajal-konto")!;

describe("Plan …", () => {
  it("kod planu: zapis i odczyt, odrzucanie śmieci", () => {
    const input = { s: { "q-pismo": 1 as const }, o: ["o-wiem"], p: "skarga", d: ["skarga-k1"] };
    expect(decodePlan(encodePlan(input))).toEqual(input);
    expect(decodePlan("!!!")).toBeNull();
    expect(decodePlan(encodePlan({ s: { "Zły klucz": 1 } as never, o: ["<script>"], p: "x y", d: [] }))).toEqual({ s: {}, o: [], p: "", d: [] });
  });

  it("nazwa planu z instrukcji, z wartością domyślną", () => {
    expect(planTitle({ planName: "oddłużenia" })).toBe("Plan oddłużenia");
    expect(planTitle({ planName: null })).toBe("Plan działania");
    for (const i of SEED_INSTRUCTIONS) expect(i.planName, i.slug).toBeTruthy();
  });

  it("buduje checklistę z odpowiedzi: pilne, kroki drogi, dokumenty, ostrzeżenia", () => {
    const answers = ["o-nie-wiem-dlug", "o-czynnosc-tak", "o-pieniadze-nie"];
    const plan = buildPlan(ins, { s: { "q-pismo": 0 }, o: answers, p: "nie-ma-takiej", d: ["kwota-wolna-k1"] });
    expect(plan.title).toBe("Plan działania wobec komornika");
    // brak wybranej drogi → najważniejsza droga z wyniku drzewa
    expect(plan.pathId).toBe("skarga");
    expect(plan.situation[0]).toMatchObject({ answer: "Nie" });
    expect(plan.decisions).toHaveLength(3);
    const ids = plan.sections.map((s) => s.id);
    expect(ids).toEqual(expect.arrayContaining(["pilne", "kroki", "dokumenty", "uwaga", "inne"]));
    expect(plan.sections.find((s) => s.id === "kroki")!.items.map((i) => i.id)).toContain("skarga-k1");
    expect(plan.total).toBe(plan.sections.flatMap((s) => s.items).length);
  });

  it("personalizacja: imię, tryb, brakujące dokumenty, harmonogram i termin", () => {
    const answers = ["o-nie-wiem-dlug", "o-czynnosc-tak", "o-pieniadze-nie"];
    const base = buildPlan(ins, { s: {}, o: answers, p: "skarga", d: [] });
    const firstDoc = ins.paths.find((p) => p.id === "skarga")!.documents[0].id;
    const plan = buildPlan(ins, { s: { "q-pismo": 1 }, o: answers, p: "skarga", d: [firstDoc], n: "Ewa", m: "free", t: "now", h: 1, dl: "2026-10-24", g: "2026-10-17" });
    expect(plan.heading).toBe("Plan działania wobec komornika – Ewa");
    expect(plan.startDate).toBe("2026-10-17");
    expect(plan.deadline).toEqual({ date: "2026-10-24", daysLeft: 7 });
    expect(plan.sections[0].items[0].label).toContain("Twój termin: 24.10.2026");
    // tryb „z bezpłatną pomocą” dodaje punkty pomocy
    expect(plan.sections.find((s) => s.id === "pomoc")!.items.length).toBeGreaterThan(0);
    // posiadany dokument jest odhaczony, brakujące mają datę
    const docs = plan.sections.find((s) => s.id === "dokumenty")!;
    expect(docs.items.find((i) => i.id === firstDoc)!.done).toBe(true);
    expect(docs.title).toMatch(/brakujące/);
    // żadne zadanie nie wypada po terminie
    for (const i of plan.sections.flatMap((s) => s.items)) if (i.due) expect(i.due < "2026-10-24").toBe(true);
    expect(plan.summary.join(" ")).toContain("z bezpłatną pomocą");
    expect(base.sections.some((s) => s.id === "pomoc")).toBe(false);
    // tempo: więcej czasu = szybszy koniec planu
    const fast = buildPlan(ins, { s: {}, o: answers, p: "skarga", d: [], h: 3, g: "2026-10-17" });
    const slow = buildPlan(ins, { s: {}, o: answers, p: "skarga", d: [], h: 1, g: "2026-10-17" });
    expect(fast.endDate < slow.endDate).toBe(true);
  });

  it("kod planu: odrzuca złe imię i datę", () => {
    const code = encodePlan({ s: {}, o: [], p: "skarga", d: [], n: "<b>", dl: "jutro", m: "self" });
    expect(decodePlan(code)).toEqual({ s: {}, o: [], p: "skarga", d: [], m: "self" });
  });

  it("bez drzewa decyzji zostaje droga wybrana przez użytkownika", () => {
    const plan = buildPlan(ins, { s: {}, o: [], p: "porozumienie", d: ["porozumienie-k1"] });
    expect(plan.pathId).toBe("porozumienie");
    expect(plan.doneCount).toBe(1);
  });
});
