import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { InstructionCard } from "@/components/ui/Cards";
import { Illustration } from "@/components/ui/Illustration";
import { CATEGORIES, categoryBySlug } from "@/content/categories";
import { listAdminQuestions, listPublicInstructions, listPublicQuestions } from "@/lib/repo/content";

export const revalidate = 300;

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const c = categoryBySlug((await params).slug);
  if (!c) return { robots: { index: false } };
  return { title: c.name, description: c.description, alternates: { canonical: `/kategorie/${c.slug}` } };
}

export default async function CategoryPage({ params }: P) {
  const c = categoryBySlug((await params).slug);
  if (!c) notFound();
  const instructions = listPublicInstructions().map((v) => v.doc).filter((i) => i.category === c.slug);
  const questions = listPublicQuestions().map((v) => v.doc).filter((q) => q.category === c.slug);
  const upcoming = listAdminQuestions({ status: "draft", category: c.slug }).slice(0, 6);

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ name: c.name, href: `/kategorie/${c.slug}` }]} />
      <header className="mt-8 flex items-center gap-6">
        <Illustration id={c.illustration} decorative className="hidden w-32 sm:block" />
        <div>
          <p className="eyebrow">Kategoria</p>
          <h1 className="mt-2 text-h1 font-extrabold">{c.name}</h1>
          <p className="mt-2 text-lg text-muted">{c.description}</p>
        </div>
      </header>

      {instructions.length > 0 && (
        <section aria-labelledby="ins" className="mt-12">
          <h2 id="ins" className="text-h2 font-extrabold">Instrukcje</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {instructions.map((i) => (
              <li key={i.slug}><InstructionCard i={i} /></li>
            ))}
          </ul>
        </section>
      )}

      {questions.length > 0 && (
        <section aria-labelledby="pyt" className="mt-14">
          <h2 id="pyt" className="text-h2 font-extrabold">Pytania i krótkie odpowiedzi</h2>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {questions.map((q) => (
              <li key={q.slug}>
                <Link href={`/pytania/${q.slug}`} className="card flex min-h-14 items-center px-4 py-3 font-semibold no-underline hover:border-navy">{q.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {instructions.length === 0 && (
        <p className="mt-12 max-w-2xl rounded-md border border-line bg-white p-5">
          Pełna instrukcja dla tej kategorii jest w przygotowaniu. Poniżej znajdziesz pytania, na które już odpowiedzieliśmy. Jeśli potrzebujesz pomocy teraz,
          skorzystaj z <Link href="/pytania/gdzie-znalezc-bezplatna-pomoc-prawna">bezpłatnej pomocy prawnej</Link>.
        </p>
      )}

      {upcoming.length > 0 && (
        <section aria-labelledby="wkrotce" className="mt-14">
          <h2 id="wkrotce" className="text-xl font-extrabold">W przygotowaniu</h2>
          <p className="mt-1 text-sm text-muted">Pracujemy nad odpowiedziami na te pytania. Publikujemy je dopiero po sprawdzeniu źródeł.</p>
          <ul className="list-dash mt-4 text-muted">
            {upcoming.map((q) => (<li key={q.id}>{q.title}</li>))}
          </ul>
        </section>
      )}
    </div>
  );
}
