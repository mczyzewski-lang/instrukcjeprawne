import { z } from "zod";
import { validateTree } from "./decision-engine";
import type { Instruction, Question } from "./types";

/** Schematy walidacji treści (zapis w CMS, import CSV) i formularzy. */

const id = z.string().regex(/^[a-z0-9-]{1,80}$/, "Id: małe litery, cyfry i myślniki");
const slug = z.string().regex(/^[a-z0-9-]{3,120}$/, "Slug: małe litery bez polskich znaków, cyfry i myślniki");
const text = (min = 1, max = 2000) => z.string().trim().min(min, "Pole wymagane").max(max, `Maks. ${max} znaków`);
const list = z.array(text(1, 600));
const dateStr = z.string().regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, "Data w formacie RRRR-MM-DD");

export const editorialStatusSchema = z.enum(["draft", "review", "published", "archived"]);
export const categorySchema = z.enum([
  "dlugi-i-komornik",
  "firma-w-trudnosciach",
  "podatki-przedsiebiorcy",
  "ochrona-marki",
  "rozwod-i-rodzina",
  "kredyty-i-banki",
  "umowy-i-konsumenci",
  "inne-sprawy",
]);

export const sourceSchema = z.object({
  id,
  title: text(3, 400),
  publisher: text(2, 200),
  url: z.string().url("Niepoprawny URL"),
  publishedOrUpdated: dateStr.optional(),
  verifiedAt: dateStr,
  confidence: z.enum(["verified", "partial", "unverified"]),
  supports: z.string().max(1500).optional(),
  note: z.string().max(1000).optional(),
});

const stepSchema = z.object({
  id,
  number: z.number().int().min(1),
  title: text(3, 200),
  explanation: text(3, 1500),
  illustration: z.string().min(1),
  illustrationAlt: z.string().max(300).optional(),
  checklist: list.optional(),
  warning: z.string().max(800).optional(),
  sourceReferences: z.array(z.string()).optional(),
});

const checklistItemSchema = z.object({ id, label: text(1, 300), hint: z.string().max(300).optional() });

const pathSchema = z.object({
  id,
  instructionId: id,
  name: text(3, 160),
  summary: text(3, 600),
  kind: z.enum(["self", "negotiation", "formal", "court", "free-help", "check"]),
  illustration: z.string().min(1),
  whenApplicable: list,
  whenNotApplicable: list,
  benefits: list,
  risks: list,
  costs: list,
  requirements: list,
  firstStep: text(3, 600),
  steps: z.array(stepSchema).min(1, "Ścieżka musi mieć co najmniej 1 krok"),
  documents: z.array(checklistItemSchema),
  expertHelpAvailable: z.boolean(),
  sourceReferences: z.array(z.string()).optional(),
});

const optionSchema = z.object({
  id,
  label: text(1, 200),
  nextNodeId: id.optional(),
  outcomeIds: z.array(id).optional(),
  uncertain: z.boolean().optional(),
});

const treeSchema = z.object({
  id,
  title: text(3, 200),
  intro: text(3, 600),
  startNodeId: id,
  nodes: z.array(z.object({ id, question: text(3, 300), help: z.string().max(400).optional(), options: z.array(optionSchema).min(2) })).min(1),
  outcomes: z
    .array(
      z.object({
        id,
        title: text(3, 200),
        description: text(3, 800),
        pathIds: z.array(id),
        instructionSlug: slug.optional(),
        urgent: z.boolean().optional(),
        priority: z.number().optional(),
      }),
    )
    .min(1),
});

export const instructionSchema = z
  .object({
    id,
    slug,
    title: text(5, 200),
    subtitle: text(3, 300),
    category: categorySchema,
    shortDescription: text(10, 600),
    estimatedReadingTime: z.number().int().min(1).max(60),
    illustration: z.string().min(1),
    updatedAt: dateStr,
    researchedAt: dateStr,
    legalReviewedAt: dateStr.nullable(),
    legalReviewedBy: z.string().max(120).nullable().optional(),
    editorialStatus: editorialStatusSchema,
    aiAssisted: z.boolean(),
    urgent: z.object({ title: text(3, 200), items: list.min(1) }).optional(),
    situationQuestions: z.array(z.object({ id, question: text(3, 300), ifYes: text(3, 600), ifNo: text(3, 600) })).max(8),
    decisionTree: treeSchema,
    paths: z.array(pathSchema).min(1),
    warnings: z.array(
      z.object({ id, title: text(3, 200), body: text(3, 1200), severity: z.enum(["urgent", "important"]), sourceReferences: z.array(z.string()).optional() }),
    ),
    freeHelp: z.array(z.object({ name: text(2, 200), description: text(2, 600), url: z.string().url().optional(), phone: z.string().max(40).optional() })),
    sourceReferences: z.array(sourceSchema),
    legalStatusNote: text(3, 1500),
    pendingVerification: z.array(z.string().max(600)),
    relatedQuestions: z.array(slug),
    relatedInstructions: z.array(slug),
    leadTopic: z.string().max(80).nullable(),
    expertId: z.string().max(80).nullable().optional(),
  })
  .superRefine((doc, ctx) => {
    const pathIds = doc.paths.map((p) => p.id);
    if (new Set(pathIds).size !== pathIds.length) ctx.addIssue({ code: "custom", message: "Powtórzone id ścieżek", path: ["paths"] });
    for (const err of validateTree(doc.decisionTree as Instruction["decisionTree"], pathIds)) {
      ctx.addIssue({ code: "custom", message: err, path: ["decisionTree"] });
    }
    const sourceIds = new Set(doc.sourceReferences.map((s) => s.id));
    const check = (refs: string[] | undefined, where: (string | number)[]) => {
      for (const r of refs ?? []) if (!sourceIds.has(r)) ctx.addIssue({ code: "custom", message: `Nieznane źródło „${r}”`, path: where });
    };
    doc.paths.forEach((p, pi) => {
      check(p.sourceReferences, ["paths", pi, "sourceReferences"]);
      p.steps.forEach((s, si) => check(s.sourceReferences, ["paths", pi, "steps", si, "sourceReferences"]));
    });
    doc.warnings.forEach((w, wi) => check(w.sourceReferences, ["warnings", wi, "sourceReferences"]));
    if (doc.editorialStatus === "published" && doc.sourceReferences.length === 0)
      ctx.addIssue({ code: "custom", message: "Opublikowana instrukcja musi mieć źródła", path: ["sourceReferences"] });
  });

export const videoSchema = z.object({
  platform: z.enum(["own", "instagram", "tiktok", "youtube"]),
  url: z.string().url(),
  title: text(2, 200),
  transcript: z.string().max(20000).optional(),
  publishedAt: dateStr.optional(),
  instructionSlug: slug.optional(),
});

export const questionSchema = z
  .object({
    id: z.string().regex(/^q-[a-z0-9-]{3,120}$/),
    slug,
    title: text(5, 200),
    category: categorySchema,
    answer: z.string().max(1500),
    actions: z.array(text(1, 400)),
    explanation: z.string().max(5000).optional(),
    sourceReferences: z.array(sourceSchema),
    relatedInstruction: slug.nullable(),
    relatedPath: id.nullable().optional(),
    relatedQuestions: z.array(slug),
    relatedVideo: videoSchema.nullable().optional(),
    status: editorialStatusSchema,
    aiAssisted: z.boolean(),
    legalReviewedAt: dateStr.nullable(),
    updatedAt: dateStr,
    editorialNote: z.string().max(1000).optional(),
    priority: z.enum(["high", "medium", "low"]).optional(),
  })
  .superRefine((q, ctx) => {
    if (q.status === "review" || q.status === "published") {
      if (q.answer.trim().length < 20) ctx.addIssue({ code: "custom", message: "Odpowiedź jest wymagana przed publikacją", path: ["answer"] });
      if (q.actions.length === 0) ctx.addIssue({ code: "custom", message: "Dodaj co najmniej jedno działanie", path: ["actions"] });
      if (q.sourceReferences.length === 0) ctx.addIssue({ code: "custom", message: "Dodaj co najmniej jedno źródło", path: ["sourceReferences"] });
    }
  });

/* ---------- Formularz kontaktu ---------- */

export const leadSchema = z.object({
  name: z.string().trim().min(2, "Podaj imię").max(80, "Imię jest za długie"),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s()-]/g, ""))
    .refine((v) => /^(\+48)?\d{9}$/.test(v) || /^\+\d{8,15}$/.test(v), "Podaj poprawny numer telefonu, np. 600 100 200"),
  email: z
    .string()
    .trim()
    .max(160)
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v), "Podaj poprawny adres e-mail albo zostaw pole puste"),
  topic: z.string().min(1).max(80),
  instructionSlug: slug.optional(),
  pathId: id.optional(),
  context: z.string().max(400).optional(),
  contactConsent: z.literal(true, { error: "Zgoda na kontakt jest potrzebna, aby ekspert mógł oddzwonić" }),
  /* antyspam */
  website: z.string().max(0).optional(),
  startedAt: z.number().int().positive(),
});

export type LeadInput = z.infer<typeof leadSchema>;

export function parseInstruction(data: unknown): { ok: true; value: Instruction } | { ok: false; errors: string[] } {
  const r = instructionSchema.safeParse(data);
  if (r.success) return { ok: true, value: r.data as Instruction };
  return { ok: false, errors: r.error.issues.map((i) => `${i.path.join(".") || "dokument"}: ${i.message}`) };
}

export function parseQuestion(data: unknown): { ok: true; value: Question } | { ok: false; errors: string[] } {
  const r = questionSchema.safeParse(data);
  if (r.success) return { ok: true, value: r.data as Question };
  return { ok: false, errors: r.error.issues.map((i) => `${i.path.join(".") || "dokument"}: ${i.message}`) };
}

/* ---------- Czat z ekspertem ---------- */

export const PHONE_PREFIXES = ["+48", "+49", "+44", "+353", "+31", "+47", "+46", "+420", "+380", "+1"] as const;

export const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const chatStartSchema = z.object({
  name: z.string().trim().min(2, "Podaj imię").max(80, "Imię jest za długie"),
  email: z.string().trim().max(160).refine((v) => emailRe.test(v), "Podaj poprawny adres e-mail"),
  marketingConsent: z.boolean().default(false),
  phonePrefix: z.enum(PHONE_PREFIXES),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s()-]/g, ""))
    .refine((v) => /^\d{6,12}$/.test(v), "Podaj poprawny numer telefonu (same cyfry, bez prefiksu)"),
  message: z.string().trim().min(5, "Napisz krótko, w czym możemy pomóc").max(2000, "Wiadomość jest za długa (maks. 2000 znaków)"),
  topic: z.string().min(1).max(80),
  instructionSlug: slug.optional(),
  pathId: id.optional(),
  website: z.string().max(0).optional(),
  startedAt: z.number().int().positive(),
});

export type ChatStartInput = z.infer<typeof chatStartSchema>;

export const chatMessageSchema = z.object({
  token: z.string().min(20).max(100),
  message: z.string().trim().min(1).max(2000, "Wiadomość jest za długa (maks. 2000 znaków)"),
});
