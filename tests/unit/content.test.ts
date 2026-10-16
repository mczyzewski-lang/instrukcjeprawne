import { describe, expect, it } from "vitest";
import { SEED_INSTRUCTIONS, SEED_QUESTIONS } from "@/content";
import { illustrations } from "@/illustrations/library";
import { parseInstruction, parseQuestion } from "@/lib/schemas";

describe("treści startowe", () => {
  it.each(SEED_INSTRUCTIONS.map((i) => [i.slug, i]))("instrukcja %s przechodzi walidację", (_slug, ins) => {
    const r = parseInstruction(ins);
    if (!r.ok) throw new Error(r.errors.join("\n"));
    expect(r.ok).toBe(true);
  });

  it("wszystkie ilustracje istnieją w bibliotece", () => {
    const missing: string[] = [];
    for (const ins of SEED_INSTRUCTIONS) {
      for (const id of [ins.illustration, ...ins.paths.flatMap((p) => [p.illustration, ...p.steps.map((s) => s.illustration)])]) {
        if (!illustrations[id]) missing.push(`${ins.slug}: ${id}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("pytania przechodzą walidację, a slugi są unikalne", () => {
    const slugs = new Set<string>();
    for (const q of SEED_QUESTIONS) {
      const r = parseQuestion(q);
      if (!r.ok) throw new Error(`${q.slug}: ${r.errors.join("; ")}`);
      expect(slugs.has(q.slug)).toBe(false);
      slugs.add(q.slug);
    }
    expect(SEED_QUESTIONS.length).toBeGreaterThanOrEqual(100);
  });

  it("odwołania do instrukcji istnieją", () => {
    const slugs = new Set(SEED_INSTRUCTIONS.map((i) => i.slug));
    for (const ins of SEED_INSTRUCTIONS) {
      for (const r of ins.relatedInstructions) expect(slugs, `${ins.slug} → ${r}`).toContain(r);
      for (const o of ins.decisionTree.outcomes) if (o.instructionSlug) expect(slugs).toContain(o.instructionSlug);
    }
    for (const q of SEED_QUESTIONS) if (q.relatedInstruction) expect(slugs, q.slug).toContain(q.relatedInstruction);
  });
});
