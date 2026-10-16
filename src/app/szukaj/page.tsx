import type { Metadata } from "next";
import Link from "next/link";
import { SearchBox } from "@/components/ui/SearchBox";
import { prepare, search } from "@/lib/search";
import { buildSearchDocs } from "@/lib/search-index";

export const metadata: Metadata = { title: "Szukaj", robots: { index: false, follow: true } };

const TYPE = { instruction: "Instrukcja", question: "Pytanie", path: "Droga w instrukcji" } as const;

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").slice(0, 200);
  const docs = buildSearchDocs();
  const hits = q ? search(prepare(docs), q, 20) : [];
  return (
    <div className="container-text py-10">
      <h1 className="text-h2 font-extrabold">Szukaj</h1>
      <div className="mt-6">
        <SearchBox docs={docs} size="md" initialQuery={q} />
      </div>
      {q && (
        <p className="mt-6 text-sm text-muted" role="status">
          {hits.length ? `Wyniki dla „${q}”: ${hits.length}` : `Nie znaleźliśmy nic dla „${q}”.`}
        </p>
      )}
      <ul className="mt-4 grid gap-3">
        {hits.map((h) => (
          <li key={h.url}>
            <Link href={h.url} className="card block p-4 no-underline hover:border-navy">
              <span className="eyebrow">{TYPE[h.type]}</span>
              <span className="mt-1 block text-lg font-extrabold">{h.title}</span>
              <span className="mt-1 block text-sm text-muted">{h.snippet}</span>
            </Link>
          </li>
        ))}
      </ul>
      {q && hits.length === 0 && (
        <div className="mt-6 card p-5">
          <p className="font-bold">Spróbuj prostszych słów, np. „komornik”, „długi”, „rozwód”, „kredyt”.</p>
          <p className="mt-2 text-sm">
            Możesz też przejrzeć <Link href="/instrukcje">wszystkie instrukcje</Link> lub skorzystać z{" "}
            <Link href="/pytania/gdzie-znalezc-bezplatna-pomoc-prawna">bezpłatnej pomocy prawnej</Link>.
          </p>
        </div>
      )}
    </div>
  );
}
