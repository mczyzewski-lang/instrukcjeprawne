import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate } from "@/components/instruction/ServerSections";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/ui/JsonLd";
import { ReviewBanner } from "@/components/ui/ReviewBanner";
import { StepNumber } from "@/components/ui/StepNumber";
import { VideoBlock } from "@/components/ui/VideoBlock";
import { categoryBySlug } from "@/content/categories";
import { siteUrl } from "@/lib/config";
import { getPublicInstruction, getPublicQuestion, listPublicQuestions } from "@/lib/repo/content";

export const revalidate = 300;

export function generateStaticParams() {
  return listPublicQuestions().map((v) => ({ slug: v.doc.slug }));
}

type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  const v = getPublicQuestion(slug);
  if (!v) return { title: "Nie znaleziono pytania", robots: { index: false } };
  return {
    title: v.doc.title,
    description: v.doc.answer.slice(0, 160),
    alternates: { canonical: `/pytania/${slug}` },
    openGraph: { title: v.doc.title, description: v.doc.answer.slice(0, 160), type: "article" },
    robots: v.reviewed ? undefined : { index: false, follow: true },
  };
}

export default async function QuestionPage({ params }: P) {
  const { slug } = await params;
  const v = getPublicQuestion(slug);
  if (!v) notFound();
  const q = v.doc;
  const cat = categoryBySlug(q.category);
  const ins = q.relatedInstruction ? getPublicInstruction(q.relatedInstruction)?.doc : null;
  const path = ins && q.relatedPath ? ins.paths.find((p) => p.id === q.relatedPath) : null;
  const related = q.relatedQuestions.map((s) => getPublicQuestion(s)?.doc).filter((x) => x !== undefined);
  const sameCat = listPublicQuestions()
    .map((x) => x.doc)
    .filter((x) => x.category === q.category && x.slug !== q.slug && !q.relatedQuestions.includes(x.slug))
    .slice(0, Math.max(0, 4 - related.length));

  return (
    <article className="container-text py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "QAPage",
          mainEntity: { "@type": "Question", name: q.title, answerCount: 1, acceptedAnswer: { "@type": "Answer", text: q.answer, url: `${siteUrl()}/pytania/${q.slug}` } },
        }}
      />
      <Breadcrumbs items={[{ name: "Pytania", href: "/pytania" }, ...(cat ? [{ name: cat.name, href: `/kategorie/${cat.slug}` }] : []), { name: q.title, href: `/pytania/${q.slug}` }]} />
      <h1 className="mt-8 text-h1 font-extrabold">{q.title}</h1>
      {!v.reviewed && <div className="mt-6"><ReviewBanner kind="odpowiedź" /></div>}
      <p className="mt-8 border-l-4 border-gold pl-5 text-xl font-semibold leading-relaxed sm:text-2xl">{q.answer}</p>

      {q.actions.length > 0 && (
        <section aria-labelledby="co-zrobic" className="mt-12">
          <h2 id="co-zrobic" className="text-h2 font-extrabold">Co zrobić?</h2>
          <ol className="mt-6 grid gap-6">
            {q.actions.map((a, i) => (
              <li key={a} className="flex gap-5">
                <StepNumber n={i + 1} size="sm" />
                <p className="pt-1 text-lg">{a}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {q.explanation && (
        <section aria-labelledby="wyjasnienie" className="mt-12">
          <h2 id="wyjasnienie" className="text-xl font-extrabold">Wyjaśnienie</h2>
          <p className="mt-3">{q.explanation}</p>
        </section>
      )}

      {q.relatedVideo && <VideoBlock video={q.relatedVideo} />}

      {ins && (
        <Link href={`/instrukcje/${ins.slug}${path ? `#droga-${path.id}` : ""}`} className="card mt-12 flex items-center justify-between gap-4 p-5 no-underline hover:border-navy">
          <span>
            <span className="eyebrow">Zobacz całą instrukcję</span>
            <span className="mt-1 block text-lg font-extrabold">{ins.title}</span>
            {path && <span className="mt-1 block text-sm text-muted">Droga: {path.name}</span>}
          </span>
          <ArrowRight className="h-5 w-5 shrink-0" aria-hidden="true" />
        </Link>
      )}

      {(related.length > 0 || sameCat.length > 0) && (
        <section aria-labelledby="powiazane" className="mt-12">
          <h2 id="powiazane" className="text-xl font-extrabold">Powiązane pytania</h2>
          <ul className="mt-4 grid gap-2">
            {[...related, ...sameCat].map((r) => (
              <li key={r.slug}><Link href={`/pytania/${r.slug}`} className="font-semibold">{r.title}</Link></li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="zrodla" className="mt-12 border-t border-line pt-8">
        <h2 id="zrodla" className="text-xl font-extrabold">Źródła i stan prawny</h2>
        <p className="mt-2 text-sm text-muted">
          Stan na: {formatDate(q.updatedAt)} · Weryfikacja przez prawnika: {v.reviewed && q.legalReviewedAt ? formatDate(q.legalReviewedAt) : "oczekuje"}
        </p>
        <ol className="mt-4 grid gap-2 text-sm">
          {q.sourceReferences.map((s, i) => (
            <li key={s.id}>
              [{i + 1}] <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a> – {s.publisher}
              <span className="text-xs text-muted"> (sprawdzono {formatDate(s.verifiedAt)})</span>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-sm text-muted">Informacja ogólna, nie indywidualna opinia prawna.</p>
      </section>
    </article>
  );
}
