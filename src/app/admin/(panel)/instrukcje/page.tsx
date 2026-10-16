import Link from "next/link";
import { createInstructionAction } from "@/app/admin/actions";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { CATEGORIES } from "@/content/categories";
import { listAdminInstructions } from "@/lib/repo/content";

export const metadata = { title: "Instrukcje" };

export default async function AdminInstructions({ searchParams }: { searchParams: Promise<{ blad?: string }> }) {
  const { blad } = await searchParams;
  const items = listAdminInstructions();
  return (
    <div className="grid gap-8">
      <h1 className="text-h2 font-extrabold">Instrukcje</h1>
      {blad && <p role="alert" className="field-error">{blad}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line text-muted">
            <tr><th className="py-2">Tytuł</th><th>Status</th><th>Publikacja</th><th>Zmiana</th><th></th></tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-b border-line">
                <td className="py-3 pr-4 font-semibold">{i.title}<span className="block text-xs font-normal text-muted">/instrukcje/{i.slug}</span></td>
                <td><StatusBadge status={i.status} />{i.hasUnpublishedChanges && <span className="badge ml-1">niepubl. zmiany</span>}</td>
                <td className="text-muted">{i.publishedAt ? i.publishedAt.slice(0, 10) : "—"}</td>
                <td className="text-muted">{i.updatedAt.slice(0, 10)}</td>
                <td className="whitespace-nowrap text-right"><Link href={`/admin/instrukcje/${i.id}`}>Edytuj</Link> · <Link href={`/admin/podglad/instrukcje/${i.id}`}>Podgląd</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form action={createInstructionAction} className="card grid gap-3 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <p className="font-extrabold sm:col-span-3">Nowa instrukcja</p>
        <label><span className="field-label">Tytuł (pytanie użytkownika)</span><input name="title" required minLength={5} className="field-input" placeholder="Jak …?" /></label>
        <label><span className="field-label">Kategoria</span>
          <select name="category" className="field-input">{CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select>
        </label>
        <button className="btn btn-primary">Utwórz szkic</button>
      </form>
    </div>
  );
}
