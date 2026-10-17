"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkPassword, clearSession, requireAdmin, setSession } from "@/lib/auth";
import { adminPassword } from "@/lib/config";
import { questionsFromCsv } from "@/lib/csv";
import { generateIllustration, saveUploadedIllustration, setIllustrationStatus, updateIllustrationAlt } from "@/lib/illustration-generator";
import {
  getInstructionForEdit,
  getQuestionForEdit,
  publishInstruction,
  publishQuestion,
  questionExists,
  saveInstructionDraft,
  saveQuestion,
  unpublishInstruction,
  unpublishQuestion,
} from "@/lib/repo/content";
import { deleteLead, forwardLead, getLeadConfig, saveLeadConfig } from "@/lib/repo/leads";
import { rateLimit } from "@/lib/repo/rate-limit";
import type { Instruction, Question } from "@/lib/types";

/* ---------- logowanie ---------- */

export async function loginAction(_prev: { error?: string; name?: string } | undefined, fd: FormData): Promise<{ error?: string; name?: string }> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!adminPassword()) return { error: "Panel jest wyłączony: ustaw zmienną ADMIN_PASSWORD." };
  if (!rateLimit(`login:${ip}`, 10, 900)) return { error: "Zbyt wiele prób. Spróbuj za 15 minut." };
  const name = String(fd.get("name") ?? "").trim().slice(0, 80);
  if (name.length < 2) return { error: "Podaj imię i nazwisko – zapisujemy je przy zatwierdzanych treściach.", name };
  if (!checkPassword(String(fd.get("password") ?? ""))) return { error: "Nieprawidłowe hasło.", name };
  await setSession(name);
  redirect("/admin");
}

export async function logoutAction() {
  await clearSession();
  redirect("/admin/login");
}

/* ---------- instrukcje ---------- */

function revalidateInstruction(slug: string) {
  revalidatePath("/");
  revalidatePath("/instrukcje");
  revalidatePath(`/instrukcje/${slug}`);
  revalidatePath("/sitemap.xml");
}

export type ActionResult = { ok: boolean; errors?: string[]; message?: string };

export async function saveInstructionAction(id: string, json: string, status: "draft" | "review"): Promise<ActionResult> {
  await requireAdmin();
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return { ok: false, errors: ["Niepoprawny JSON"] };
  }
  const r = saveInstructionDraft(id, data, status);
  if (!r.ok) return { ok: false, errors: r.errors };
  revalidateInstruction((data as Instruction).slug);
  return { ok: true, message: status === "review" ? "Zapisano i przekazano do zatwierdzenia." : "Zapisano szkic." };
}

export async function publishInstructionAction(id: string): Promise<ActionResult> {
  const s = await requireAdmin();
  const r = publishInstruction(id, s.name);
  if (!r.ok) return { ok: false, errors: r.errors };
  const cur = getInstructionForEdit(id);
  if (cur) revalidateInstruction(cur.draft.slug);
  return { ok: true, message: `Opublikowano. Zatwierdził(a): ${s.name}.` };
}

export async function unpublishInstructionAction(id: string, archive: boolean): Promise<ActionResult> {
  await requireAdmin();
  const r = unpublishInstruction(id, archive);
  if (!r.ok) return { ok: false, errors: r.errors };
  const cur = getInstructionForEdit(id);
  if (cur) revalidateInstruction(cur.draft.slug);
  return { ok: true, message: archive ? "Przeniesiono do archiwum." : "Wycofano publikację – instrukcja jest szkicem." };
}

export async function createInstructionAction(fd: FormData) {
  await requireAdmin();
  const { slugify } = await import("@/lib/csv");
  const title = String(fd.get("title") ?? "").trim();
  const slug = slugify(String(fd.get("slug") || title));
  const category = String(fd.get("category") ?? "inne-sprawy") as Instruction["category"];
  const id = `ins-${slug}`.slice(0, 80);
  const today = new Date().toISOString().slice(0, 10);
  const doc: Instruction = {
    id,
    slug,
    title: title || "Nowa instrukcja",
    subtitle: "Uzupełnij podtytuł.",
    category,
    shortDescription: "Uzupełnij krótki opis instrukcji (co najmniej 10 znaków).",
    estimatedReadingTime: 5,
    illustration: "person-question",
    updatedAt: today,
    researchedAt: today,
    legalReviewedAt: null,
    editorialStatus: "draft",
    aiAssisted: false,
    situationQuestions: [],
    decisionTree: {
      id: `${id}-drzewo`,
      title: "Sprawdź, które drogi warto rozważyć",
      intro: "Uzupełnij wprowadzenie.",
      startNodeId: "n-start",
      nodes: [
        {
          id: "n-start",
          question: "Pierwsze pytanie?",
          options: [
            { id: "o-tak", label: "Tak", outcomeIds: ["r-droga"] },
            { id: "o-nie", label: "Nie", outcomeIds: ["r-droga"] },
          ],
        },
      ],
      outcomes: [{ id: "r-droga", title: "Pierwsza droga", description: "Opis wyniku.", pathIds: ["droga-1"] }],
    },
    paths: [
      {
        id: "droga-1",
        instructionId: id,
        name: "Pierwsza droga",
        summary: "Opis drogi.",
        kind: "self",
        illustration: "checklist",
        whenApplicable: [],
        whenNotApplicable: [],
        benefits: [],
        risks: [],
        costs: [],
        requirements: [],
        firstStep: "Opisz pierwszy krok.",
        steps: [{ id: "droga-1-k1", number: 1, title: "Pierwszy krok", explanation: "Wyjaśnienie kroku.", illustration: "checklist" }],
        documents: [],
        expertHelpAvailable: false,
      },
    ],
    warnings: [],
    freeHelp: [],
    sourceReferences: [],
    legalStatusNote: "Uzupełnij opis stanu prawnego.",
    pendingVerification: [],
    relatedQuestions: [],
    relatedInstructions: [],
    leadTopic: null,
  };
  const r = saveInstructionDraft(id, doc, "draft");
  if (!r.ok) redirect(`/admin/instrukcje?blad=${encodeURIComponent(r.errors.join("; "))}`);
  redirect(`/admin/instrukcje/${id}`);
}

/* ---------- pytania ---------- */

function revalidateQuestion(slug: string) {
  revalidatePath("/pytania");
  revalidatePath(`/pytania/${slug}`);
  revalidatePath("/sitemap.xml");
}

export async function saveQuestionAction(json: string, status: "draft" | "review"): Promise<ActionResult & { id?: string }> {
  await requireAdmin();
  let data: Question;
  try {
    data = JSON.parse(json);
  } catch {
    return { ok: false, errors: ["Niepoprawny JSON"] };
  }
  const r = saveQuestion(data, status);
  if (!r.ok) return { ok: false, errors: r.errors };
  revalidateQuestion(data.slug);
  return { ok: true, id: r.id, message: status === "review" ? "Zapisano i przekazano do zatwierdzenia." : "Zapisano szkic." };
}

export async function publishQuestionAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const r = publishQuestion(id);
  if (!r.ok) return { ok: false, errors: r.errors };
  const cur = getQuestionForEdit(id);
  if (cur) revalidateQuestion(cur.draft.slug);
  return { ok: true, message: "Opublikowano." };
}

export async function unpublishQuestionAction(id: string, archive: boolean): Promise<ActionResult> {
  await requireAdmin();
  const r = unpublishQuestion(id, archive);
  if (!r.ok) return { ok: false, errors: r.errors };
  const cur = getQuestionForEdit(id);
  if (cur) revalidateQuestion(cur.draft.slug);
  return { ok: true, message: archive ? "Przeniesiono do archiwum." : "Wycofano publikację." };
}

export interface ImportPreview {
  rows: { line: number; title: string; slug: string; errors: string[]; exists: boolean }[];
  imported?: number;
}

export async function importCsvAction(_prev: ImportPreview | undefined, fd: FormData): Promise<ImportPreview> {
  await requireAdmin();
  const file = fd.get("file");
  let text = String(fd.get("csv") ?? "");
  if (file instanceof File && file.size > 0) {
    if (file.size > 2 * 1024 * 1024) return { rows: [{ line: 0, title: "", slug: "", errors: ["Plik jest większy niż 2 MB"], exists: false }] };
    text = await file.text();
  }
  const parsed = questionsFromCsv(text);
  const commit = fd.get("mode") === "import";
  let imported = 0;
  const rows = parsed.map((p) => {
    const exists = p.question ? questionExists(p.question.slug) : false;
    if (commit && p.question && !exists) {
      const r = saveQuestion(p.question, "draft");
      if (r.ok) imported++;
      else p.errors.push(...r.errors);
    }
    return { line: p.line, title: p.question?.title ?? "", slug: p.question?.slug ?? "", errors: p.errors, exists };
  });
  if (commit) revalidatePath("/admin/pytania");
  return { rows, imported: commit ? imported : undefined };
}

/* ---------- leady i partnerzy ---------- */

export async function retryLeadAction(id: string) {
  await requireAdmin();
  await forwardLead(id);
  revalidatePath("/admin/leady");
}

export async function deleteLeadAction(id: string) {
  await requireAdmin();
  deleteLead(id);
  revalidatePath("/admin/leady");
}

export async function saveLeadConfigAction(fd: FormData) {
  await requireAdmin();
  const topic = String(fd.get("topic"));
  const cur = getLeadConfig(topic);
  if (!cur) return;
  const partnerName = String(fd.get("partnerName") ?? "").trim().slice(0, 120) || cur.partnerName;
  const visibleDisclosure = String(fd.get("visibleDisclosure") ?? "").trim().slice(0, 1000) || cur.visibleDisclosure;
  const webhookEnv = String(fd.get("webhookEnv") ?? "").trim();
  saveLeadConfig({
    ...cur,
    partnerName,
    visibleDisclosure,
    webhookEnv: /^LEAD_WEBHOOK_[A-Z0-9_]{1,40}$/.test(webhookEnv) ? webhookEnv : cur.webhookEnv,
    formConfiguration: { ...cur.formConfiguration, askEmail: fd.get("askEmail") === "on" },
  });
  revalidatePath("/admin/partnerzy");
  revalidatePath("/instrukcje", "layout");
}

/* ---------- ilustracje ---------- */

export async function generateIllustrationAction(fd: FormData): Promise<void> {
  await requireAdmin();
  const targetKey = String(fd.get("targetKey"));
  const action = String(fd.get("action") ?? "");
  const alt = String(fd.get("alt") ?? "");
  const force = fd.get("force") === "1";
  const r = await generateIllustration(targetKey, action, alt, { force });
  const back = String(fd.get("back") ?? "/admin/ilustracje");
  redirect(`${back}${back.includes("?") ? "&" : "?"}${r.ok ? `info=${r.cached ? "cache" : "ok"}` : `blad=${encodeURIComponent(r.error)}`}`);
}

export async function illustrationStatusAction(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id"));
  const status = fd.get("status") === "approved" ? "approved" : "rejected";
  const alt = String(fd.get("alt") ?? "").trim();
  if (alt) updateIllustrationAlt(id, alt);
  setIllustrationStatus(id, status);
  revalidatePath("/instrukcje", "layout");
  redirect(String(fd.get("back") ?? "/admin/ilustracje"));
}

export async function uploadIllustrationAction(fd: FormData) {
  await requireAdmin();
  const file = fd.get("file");
  const back = String(fd.get("back") ?? "/admin/ilustracje");
  if (!(file instanceof File) || file.size === 0) redirect(`${back}${back.includes("?") ? "&" : "?"}blad=${encodeURIComponent("Wybierz plik")}`);
  const r = saveUploadedIllustration(String(fd.get("targetKey")), Buffer.from(await (file as File).arrayBuffer()), (file as File).type, String(fd.get("alt") ?? ""));
  revalidatePath("/instrukcje", "layout");
  redirect(`${back}${back.includes("?") ? "&" : "?"}${r.ok ? "info=upload" : `blad=${encodeURIComponent(r.error)}`}`);
}

/* ---------- eksperci i ustawienia ---------- */

export async function saveExpertAction(fd: FormData) {
  await requireAdmin();
  const { getExpert, saveExpert } = await import("@/lib/repo/experts");
  const id = String(fd.get("id"));
  const cur = getExpert(id);
  if (!cur) redirect("/admin/eksperci");
  const str = (k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max);
  const name = str("name", 120);
  const status = fd.get("status") === "published" ? "published" : "draft";
  const categories = fd.getAll("categories").map(String) as typeof cur.categories;
  if (status === "published" && (name.length < 3 || !str("title", 120) || !str("bio", 1200))) {
    redirect(`/admin/eksperci?blad=${encodeURIComponent("Aby opublikować, uzupełnij imię i nazwisko, tytuł zawodowy i opis.")}#${id}`);
  }
  saveExpert({
    ...cur,
    name: name || cur.name,
    title: str("title", 120),
    role: str("role", 160),
    bio: str("bio", 1200),
    affiliation: str("affiliation", 300),
    email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(str("email", 160)) ? str("email", 160) : "",
    categories: categories.length ? categories : cur.categories,
    status,
  });
  revalidatePath("/", "layout");
  redirect(`/admin/eksperci?info=zapisano#${id}`);
}

export async function uploadExpertPhotoAction(fd: FormData) {
  await requireAdmin();
  const { saveExpertPhoto } = await import("@/lib/repo/experts");
  const id = String(fd.get("id"));
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) redirect(`/admin/eksperci?blad=${encodeURIComponent("Wybierz zdjęcie")}#${id}`);
  const r = saveExpertPhoto(id, Buffer.from(await (file as File).arrayBuffer()), (file as File).type);
  revalidatePath("/", "layout");
  redirect(r.ok ? `/admin/eksperci?info=zdjecie#${id}` : `/admin/eksperci?blad=${encodeURIComponent(r.error)}#${id}`);
}

export async function saveFoundersVideoAction(fd: FormData) {
  await requireAdmin();
  const { setSetting } = await import("@/lib/repo/experts");
  const url = String(fd.get("url") ?? "").trim();
  if (url) {
    try {
      const u = new URL(url);
      if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error();
    } catch {
      redirect(`/admin/ustawienia?blad=${encodeURIComponent("Podaj poprawny adres URL filmu")}`);
    }
  }
  setSetting("founders_video", {
    url,
    title: String(fd.get("title") ?? "").trim().slice(0, 200) || "Film od założycieli",
    poster: String(fd.get("poster") ?? "").trim().slice(0, 500) || undefined,
    transcript: String(fd.get("transcript") ?? "").trim().slice(0, 20000) || undefined,
  });
  revalidatePath("/jak-to-dziala");
  redirect("/admin/ustawienia?info=zapisano");
}

/* ---------- czaty ---------- */

export async function replyChatAction(fd: FormData) {
  const s = await requireAdmin();
  const { expertReply } = await import("@/lib/repo/chats");
  const id = String(fd.get("id"));
  const body = String(fd.get("body") ?? "").trim().slice(0, 4000);
  const as = String(fd.get("as") ?? "").trim().slice(0, 120) || s.name;
  if (!body) redirect(`/admin/czaty/${id}?blad=${encodeURIComponent("Wpisz treść odpowiedzi")}`);
  const r = await expertReply(id, as, body);
  revalidatePath(`/admin/czaty/${id}`);
  redirect(`/admin/czaty/${id}?info=${encodeURIComponent(`Wysłano. SMS: ${r.sms}`)}`);
}

export async function chatStatusAction(fd: FormData) {
  await requireAdmin();
  const { setChatStatus, deleteChat } = await import("@/lib/repo/chats");
  const id = String(fd.get("id"));
  const op = String(fd.get("op"));
  if (op === "delete") {
    deleteChat(id);
    redirect("/admin/czaty");
  }
  setChatStatus(id, op === "close" ? "closed" : "open");
  redirect(`/admin/czaty/${id}`);
}
