import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/ui/PrintButton";
import { decodeAnswers, resolve } from "@/lib/decision-engine";
import { getPublicInstruction } from "@/lib/repo/content";

export const metadata: Metadata = { title: "Podsumowanie odpowiedzi", robots: { index: false, follow: false } };

/** Drukowalne podsumowanie wyniku drzewa decyzji (link z parametrem ?odp=). */
export default async function ResultPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ odp?: string }> }) {
  const { slug } = await params;
  const { odp } = await searchParams;
  const v = getPublicInstruction(slug);
  if (!v) notFound();
  const ins = v.doc;
  const r = resolve(ins.decisionTree, decodeAnswers(odp));
  const nodes = new Map(ins.decisionTree.nodes.map((n) => [n.id, n]));
  const paths = new Map(ins.paths.map((p) => [p.id, p]));
  const pathIds = [...new Set(r.outcomes.flatMap((o) => o.pathIds))];

  return (
    <div className="container-text py-10">
      <p className="eyebrow">Podsumowanie</p>
      <h1 className="mt-2 text-h2 font-extrabold">{ins.title}</h1>
      <p className="mt-2 text-sm text-muted">Wydrukowano z InstrukcjePrawne.pl · stan prawny {ins.researchedAt.split("-").reverse().join(".")}</p>
      {!v.reviewed && <p className="mt-3 text-sm font-semibold">Wersja robocza – przed weryfikacją przez prawnika.</p>}

      <h2 className="mt-8 text-xl font-extrabold">Twoje odpowiedzi</h2>
      {r.answers.length === 0 ? (
        <p className="mt-2 text-muted">Brak odpowiedzi. Wróć do instrukcji i odpowiedz na pytania.</p>
      ) : (
        <ol className="mt-3 grid gap-2">
          {r.answers.map((a, i) => {
            const n = nodes.get(a.nodeId)!;
            return (
              <li key={a.nodeId} className="card p-3 text-sm">
                <span className="font-bold">
                  {i + 1}. {n.question}
                </span>
                <br />→ {n.options.find((o) => o.id === a.optionId)?.label}
              </li>
            );
          })}
        </ol>
      )}

      {r.complete && (
        <>
          <h2 className="mt-8 text-xl font-extrabold">Drogi warte sprawdzenia</h2>
          <p className="mt-1 text-sm text-muted">Orientacja na podstawie odpowiedzi – nie ocena prawna.</p>
          {r.uncertain && <p className="mt-2 text-sm font-semibold">Część odpowiedzi to „nie wiem” – wynik jest niepełny.</p>}
          <ol className="mt-3 grid gap-2">
            {r.outcomes.map((o) => (
              <li key={o.id} className={`rounded-md border p-3 text-sm ${o.urgent ? "border-urgent" : "border-line"} bg-white`}>
                <strong>
                  {o.urgent ? "Pilne: " : ""}
                  {o.title}
                </strong>
                <br />
                {o.description}
              </li>
            ))}
          </ol>
          {pathIds.length > 0 && (
            <>
              <h2 className="mt-8 text-xl font-extrabold">Pierwsze kroki</h2>
              <ul className="mt-3 grid gap-2 text-sm">
                {pathIds.map((id) => {
                  const p = paths.get(id);
                  return p ? (
                    <li key={id} className="card p-3">
                      <strong>{p.name}:</strong> {p.firstStep}
                    </li>
                  ) : null;
                })}
              </ul>
            </>
          )}
        </>
      )}
      <div className="no-print mt-8 flex gap-3">
        <PrintButton />
        <Link href={`/instrukcje/${slug}${odp ? `?odp=${encodeURIComponent(odp)}` : ""}#drzewo`} className="btn btn-secondary">
          Wróć do instrukcji
        </Link>
      </div>
    </div>
  );
}
