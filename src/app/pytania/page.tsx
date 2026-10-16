import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SearchBox } from "@/components/ui/SearchBox";
import { CATEGORIES } from "@/content/categories";
import { listPublicQuestions } from "@/lib/repo/content";
import { buildSearchDocs } from "@/lib/search-index";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Najczęstsze pytania",
  description: "Krótkie odpowiedzi na pytania, które ludzie najczęściej zadają w sprawach długów, komornika, firmy, podatków, rozwodu i kredytów.",
  alternates: { canonical: "/pytania" },
};

export default function QuestionsPage() {
  const qs = listPublicQuestions().map((v) => v.doc);
  const docs = buildSearchDocs().filter((d) => d.type === "question");
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ name: "Pytania", href: "/pytania" }]} />
      <h1 className="mt-8 text-h1 font-extrabold">Najczęstsze pytania</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">Krótka odpowiedź, konkretne działania i link do pełnej instrukcji.</p>
      <div className="mt-8 max-w-2xl">
        <SearchBox docs={docs} size="md" label="Szukaj pytania" placeholder="Np. czy komornik może zająć 800+?" />
      </div>
      {CATEGORIES.map((c) => {
        const items = qs.filter((q) => q.category === c.slug);
        if (!items.length) return null;
        return (
          <section key={c.slug} aria-labelledby={`q-${c.slug}`} className="mt-12">
            <h2 id={`q-${c.slug}`} className="text-xl font-extrabold">
              <Link href={`/kategorie/${c.slug}`} className="no-underline hover:underline">{c.name}</Link>
            </h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {items.map((q) => (
                <li key={q.slug}>
                  <Link href={`/pytania/${q.slug}`} className="card flex min-h-14 items-center px-4 py-3 font-semibold no-underline hover:border-navy">{q.title}</Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
