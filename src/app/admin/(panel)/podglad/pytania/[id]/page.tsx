import { notFound } from "next/navigation";
import { getQuestionForEdit } from "@/lib/repo/content";

export const metadata = { title: "Podgląd pytania", robots: { index: false, follow: false } };

export default async function PreviewQuestion({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cur = getQuestionForEdit(id);
  if (!cur) notFound();
  const q = cur.draft;
  return (
    <article className="container-text">
      <p className="rounded-md border-2 border-navy bg-white px-4 py-3 text-sm font-bold">Podgląd wersji roboczej – niewidoczny publicznie.</p>
      <h1 className="mt-6 text-h1 font-extrabold">{q.title}</h1>
      <p className="mt-6 border-l-4 border-gold pl-5 text-xl font-semibold">{q.answer || "(brak odpowiedzi)"}</p>
      <ol className="mt-8 list-decimal pl-6">{q.actions.map((a) => <li key={a} className="mt-2">{a}</li>)}</ol>
      {q.explanation && <p className="mt-6">{q.explanation}</p>}
      <ul className="mt-6 text-sm">{q.sourceReferences.map((s) => <li key={s.id}><a href={s.url}>{s.title}</a> ({s.confidence})</li>)}</ul>
    </article>
  );
}
