import { notFound } from "next/navigation";
import { InstructionEditor } from "@/components/admin/InstructionEditor";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { getInstructionForEdit } from "@/lib/repo/content";
import { listLeadConfigs } from "@/lib/repo/leads";

export const metadata = { title: "Edycja instrukcji" };

export default async function EditInstruction({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cur = getInstructionForEdit(id);
  if (!cur) notFound();
  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">Edycja instrukcji</p>
        <h1 className="mt-1 text-h2 font-extrabold">{cur.draft.title}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
          <StatusBadge status={cur.status} />
          {cur.published ? `Opublikowana wersja: weryfikacja ${cur.published.legalReviewedAt} (${cur.published.legalReviewedBy ?? "—"})` : "Brak opublikowanej wersji"}
        </p>
      </div>
      <InstructionEditor initial={cur.draft} status={cur.status} hasPublished={Boolean(cur.published)} leadTopics={listLeadConfigs().map((c) => c.topic)} />
    </div>
  );
}
