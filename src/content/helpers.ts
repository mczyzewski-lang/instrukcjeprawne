import type { ChecklistItem, Instruction, Path, Step } from "@/lib/types";

type StepInput = Omit<Step, "id" | "number">;
type PathInput = Omit<Path, "instructionId" | "steps" | "documents"> & {
  steps: StepInput[];
  documents: (string | Omit<ChecklistItem, "id">)[];
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);

export function definePath(instructionId: string, input: PathInput): Path {
  return {
    ...input,
    instructionId,
    steps: input.steps.map((s, i) => ({ ...s, id: `${input.id}-k${i + 1}`, number: i + 1 })),
    documents: input.documents.map((d, i) => {
      const item = typeof d === "string" ? { label: d } : d;
      return { id: `${input.id}-d${i + 1}-${slugify(item.label).slice(0, 20)}`, ...item };
    }),
  };
}

export function defineInstruction(
  input: Omit<Instruction, "paths"> & { paths: PathInput[] },
): Instruction {
  return { ...input, paths: input.paths.map((p) => definePath(input.id, p)) };
}
