import Link from "next/link";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { CATEGORIES } from "@/content/categories";
import { countQuestionsByStatus, listAdminQuestions } from "@/lib/repo/content";
import type { EditorialStatus } from "@/lib/types";

export const metadata = { title: "Pytania" };

export default async function AdminQuestions({ searchParams }: { searchParams: Promise<{ status?: string; kategoria?: string; q?: string }> }) {
  const sp = await searchParams;
  const status = ["draft", "review", "published", "archived"].includes(sp.status ?? "") ? (sp.status as EditorialStatus) : undefined;
  const items = listAdminQuestions({ status, category: sp.kategoria || undefined, q: sp.q || undefined });
  const counts = countQuestionsByStatus();
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h2 font-extrabold">Pytania</h1>
          <p className="mt-1 text-sm text-muted">
            Szkice (kolejka redakcyjna): {counts.draft ?? 0} · Do zatwierdzenia: {counts.review ?? 0} · Opublikowane: {counts.published ?? 0} · Archiwum: {counts.archived ?? 0}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/pytania/nowe" className="btn btn-primary">Nowe pytanie</Link>
          <Link href="/admin/pytania/import" className="btn btn-secondary">Import CSV</Link>
          <a href="/admin/pytania/eksport" download className="btn btn-ghost">Eksport CSV</a>
        </div>
      </div>
      <form className="flex flex-wrap gap-2" role="search">
        <input name="q" defaultValue={sp.q} placeholder="Szukaj w tytułach" className="field-input max-w-xs" />
        <select name="status" defaultValue={sp.status ?? ""} className="field-input max-w-[200px]">
          <option value="">Wszystkie statusy</option>
          <option value="draft">Szkic</option>
          <option value="review">Do zatwierdzenia</option>
          <option value="published">Opublikowane</option>
          <option value="archived">Archiwum</option>
        </select>
        <select name="kategoria" defaultValue={sp.kategoria ?? ""} className="field-input max-w-[240px]">
          <option value="">Wszystkie kategorie</option>
          {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        <button className="btn btn-secondary">Filtruj</button>
      </form>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line text-muted"><tr><th className="py-2">Pytanie</th><th>Kategoria</th><th>Priorytet</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {items.map((q) => (
              <tr key={q.id} className="border-b border-line">
                <td className="py-2.5 pr-4 font-semibold">{q.title}</td>
                <td className="text-muted">{CATEGORIES.find((c) => c.slug === q.category)?.name}</td>
                <td className="text-muted">{q.priority ?? "—"}</td>
                <td><StatusBadge status={q.status} /></td>
                <td className="text-right"><Link href={`/admin/pytania/${q.id}`}>Edytuj</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="py-6 text-muted">Brak pytań dla wybranych filtrów.</p>}
      </div>
    </div>
  );
}
