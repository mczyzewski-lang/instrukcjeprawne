import path from "node:path";
import { describe, expect, it } from "vitest";
import { illustrations } from "@/illustrations/library";
import { validateTree } from "@/lib/decision-engine";
import { parseInstruction } from "@/lib/schemas";
import type { Instruction } from "@/lib/types";

/**
 * Sprawdzenie pojedynczego pliku instrukcji przed dodaniem do src/content/index.ts:
 *   CHECK_INSTRUCTION=src/content/instructions/plik.ts npx vitest run tests/unit/instruction-file.test.ts
 */
const file = process.env.CHECK_INSTRUCTION;

describe.skipIf(!file)("plik instrukcji", () => {
  it("przechodzi walidację, drzewo jest spójne, ilustracje i źródła istnieją", async () => {
    const mod = (await import(/* @vite-ignore */ path.resolve(file!))) as Record<string, Instruction>;
    const ins = Object.values(mod).find((v) => v && typeof v === "object" && "slug" in v)!;
    const r = parseInstruction(ins);
    if (!r.ok) throw new Error(r.errors.join("\n"));
    expect(validateTree(ins.decisionTree, ins.paths.map((p) => p.id))).toEqual([]);
    const ill = [ins.illustration, ...ins.paths.flatMap((p) => [p.illustration, ...p.steps.map((s) => s.illustration)])].filter((i) => !illustrations[i]);
    expect(ill).toEqual([]);
    const srcIds = new Set(ins.sourceReferences.map((s) => s.id));
    const refs = [
      ...ins.paths.flatMap((p) => [...(p.sourceReferences ?? []), ...p.steps.flatMap((s) => s.sourceReferences ?? [])]),
      ...ins.warnings.flatMap((w) => w.sourceReferences ?? []),
    ].filter((id) => !srcIds.has(id));
    expect(refs, "odwołania do źródeł spoza listy instrukcji").toEqual([]);
  });
});
