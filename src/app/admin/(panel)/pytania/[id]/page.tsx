import { notFound } from "next/navigation";
import { QuestionEditor } from "@/components/admin/QuestionEditor";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { getQuestionForEdit, listPublicInstructions } from "@/lib/repo/content";
import type { Question } from "@/lib/types";

export const metadata = { title: "Edycja pytania" };

export default async function EditQuestion({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "nowe";
  const cur = isNew ? null : getQuestionForEdit(id);
  if (!isNew && !cur) notFound();
  const blank: Question = {
    id: "",
    slug: "",
    title: "",
    category: "inne-sprawy",
    answer: "",
    actions: [],
    sourceReferences: [],
    relatedInstruction: null,
    relatedPath: null,
    relatedQuestions: [],
    relatedVideo: null,
    status: "draft",
    aiAssisted: false,
    legalReviewedAt: null,
    updatedAt: new Date().toISOString().slice(0, 10),
  };
  const instructions = listPublicInstructions().map((v) => ({ slug: v.doc.slug, title: v.doc.title, paths: v.doc.paths.map((p) => ({ id: p.id, name: p.name })) }));
  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">{isNew ? "Nowe pytanie" : "Edycja pytania"}</p>
        <h1 className="mt-1 text-h2 font-extrabold">{cur?.draft.title || "Nowe pytanie"}</h1>
        {cur && <p className="mt-2 text-sm"><StatusBadge status={cur.status} /></p>}
        {cur?.draft.editorialNote && <p className="mt-2 text-sm text-muted">Notatka: {cur.draft.editorialNote}</p>}
      </div>
      <QuestionEditor initial={cur?.draft ?? blank} hasPublished={Boolean(cur?.published)} instructions={instructions} />
    </div>
  );
}
