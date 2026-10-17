import { Clock, Download, Scale } from "lucide-react";
import Link from "next/link";
import { ExpertByline, ExpertCard } from "@/components/instruction/Expert";
import { InstructionExplorer } from "@/components/instruction/InstructionExplorer";
import { SectionHeading } from "@/components/instruction/SectionHeading";
import { FreeHelpList, SourcesSection, WarningsSection, formatDate } from "@/components/instruction/ServerSections";
import { SectionStickyBar, type StickySection } from "@/components/instruction/SectionStickyBar";
import { SituationQuestions } from "@/components/instruction/SituationQuestions";
import { TrackedLink } from "@/components/instruction/TrackedLink";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { InstructionCard } from "@/components/ui/Cards";
import { Illustration } from "@/components/ui/Illustration";
import { JsonLd } from "@/components/ui/JsonLd";
import { ReviewBanner } from "@/components/ui/ReviewBanner";
import { categoryBySlug } from "@/content/categories";
import { SITE_NAME, siteUrl } from "@/lib/config";
import { approvedIllustrations } from "@/lib/illustration-generator";
import { expertFor } from "@/lib/repo/experts";
import { getLeadConfig } from "@/lib/repo/leads";
import { getPublicQuestion, listPublicInstructions } from "@/lib/repo/content";
import type { Instruction } from "@/lib/types";

/** Pełny widok instrukcji (strona publiczna i podgląd szkicu w CMS). */
export function InstructionView({ ins, reviewed, preview = false }: { ins: Instruction; reviewed: boolean; preview?: boolean }) {
  const v = { reviewed };
  const category = categoryBySlug(ins.category);
  const ex = expertFor(ins.category, ins.expertId);
  const sticky: StickySection[] = [
    { id: "sekcja-a", symbol: "A", title: "Zrozum swoją sytuację" },
    { id: "sekcja-b", symbol: "B", title: "Poznaj możliwe drogi" },
    { id: "sekcja-c", symbol: "C", title: "Instrukcja krok po kroku" },
    { id: "sekcja-d", symbol: "D", title: "Co przygotować?" },
    ...(ins.warnings.length ? [{ id: "sekcja-e", symbol: "E", title: "Na co uważać?" }] : []),
    { id: "sekcja-f", symbol: "F", title: "Potrzebujesz pomocy?" },
    ...(ex ? [{ id: "ekspert-h", symbol: "i", title: "Kto odpowiada za tę instrukcję" }] : []),
    { id: "zrodla-h", symbol: "§", title: "Źródła i stan prawny" },
  ];
  const sourceNumbers = Object.fromEntries(ins.sourceReferences.map((s, i) => [s.id, i + 1]));
  const approved = Object.fromEntries(approvedIllustrations(`step:${ins.id}:`));
  const leadCfg = ins.leadTopic ? getLeadConfig(ins.leadTopic) : null;
  const all = listPublicInstructions().map((x) => x.doc);
  const instructionTitles = Object.fromEntries(all.map((i) => [i.slug, i.title]));
  const related = ins.relatedInstructions.map((s) => all.find((i) => i.slug === s)).filter((i) => i !== undefined);
  const relatedQuestions = ins.relatedQuestions.map((s) => getPublicQuestion(s)?.doc).filter((q) => q !== undefined);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: ins.title,
    description: ins.shortDescription,
    inLanguage: "pl-PL",
    dateModified: ins.updatedAt,
    ...(v.reviewed && ins.legalReviewedAt ? { lastReviewed: ins.legalReviewedAt } : {}),
    mainEntityOfPage: `${siteUrl()}/instrukcje/${ins.slug}`,
    publisher: { "@type": "Organization", name: SITE_NAME, url: siteUrl() },
    citation: ins.sourceReferences.map((s) => s.url),
  };

  return (
    <article className="container-page">
      <JsonLd data={jsonLd} />
      <div className="pt-6">
        <Breadcrumbs
          items={[
            { name: "Instrukcje", href: "/instrukcje" },
            ...(category ? [{ name: category.name, href: `/kategorie/${category.slug}` }] : []),
            { name: ins.title, href: `/instrukcje/${ins.slug}` },
          ]}
        />
      </div>

      <header className="grid gap-8 py-10 sm:py-14 lg:grid-cols-[1fr_320px] lg:items-center">
        <div>
          {category && <p className="eyebrow">{category.name}</p>}
          <h1 className="mt-3 text-h1 font-extrabold">{ins.title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted sm:text-xl">{ins.subtitle}</p>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            <li className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" aria-hidden="true" /> ok. {ins.estimatedReadingTime} min
            </li>
            <li className="flex items-center gap-1.5">
              <Scale className="h-4 w-4" aria-hidden="true" /> Stan prawny: {formatDate(ins.researchedAt)}
            </li>
            <li>{v.reviewed && ins.legalReviewedAt ? `Zweryfikowano: ${formatDate(ins.legalReviewedAt)}` : "Weryfikacja prawna: oczekuje"}</li>
          </ul>
          <div className="no-print mt-8 flex flex-wrap gap-3">
            <a href="#sekcja-b" className="btn btn-primary">
              Zacznij od pytań
            </a>
            <TrackedLink href={`/instrukcje/${ins.slug}/pdf`} event="pdf_downloaded" instructionSlug={ins.slug} className="btn btn-secondary">
              <Download className="h-4 w-4" aria-hidden="true" /> Pobierz bezpłatną instrukcję PDF
            </TrackedLink>
          </div>
          <p className="no-print mt-2 text-xs text-muted">Bez podawania adresu e-mail.</p>
        </div>
        <Illustration id={ins.illustration} decorative className="mx-auto hidden w-full max-w-xs lg:block" />
      </header>

      {preview && (
        <p className="mb-4 rounded-md border-2 border-navy bg-white px-4 py-3 text-sm font-bold">
          Podgląd wersji roboczej z panelu – niewidoczny publicznie, nieindeksowany.
        </p>
      )}
      {!v.reviewed && (
        <div className="mb-8">
          <ReviewBanner />
        </div>
      )}

      {ins.urgent && (
        <aside aria-labelledby="pilne-h" className="mb-12 rounded-md border-l-4 border-urgent bg-white px-5 py-5 sm:px-7">
          <h2 id="pilne-h" className="text-lg font-extrabold">
            {ins.urgent.title}
          </h2>
          <ul className="list-dash mt-3">
            {ins.urgent.items.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </aside>
      )}

      <SectionStickyBar sections={sticky} />

      <nav aria-label="Sekcje instrukcji" className="no-print -mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-2 text-sm font-semibold">
        {[
          ["#sekcja-a", "A Sytuacja"],
          ["#sekcja-b", "B Drogi"],
          ["#kroki", "C Kroki"],
          ["#dokumenty", "D Dokumenty"],
          ["#uwaga", "E Uwaga"],
          ["#pomoc", "F Pomoc"],
          ["#zrodla", "Źródła"],
        ].map(([href, label]) => (
          <a key={href} href={href} className="badge min-h-9 shrink-0 px-3 text-sm text-navy no-underline hover:border-navy">
            {label}
          </a>
        ))}
      </nav>

      <section aria-labelledby="sekcja-a" className="border-t border-line py-12 sm:py-16">
        <SectionHeading letter="A" id="sekcja-a" title="Zrozum swoją sytuację" lead="Kilka pytań, które pomogą Ci się zorientować. To nie jest diagnoza prawna." />
        {ex && (
          <div className="mt-6 sm:pl-[5.25rem]">
            <ExpertByline expert={ex.expert} placeholder={ex.placeholder} />
          </div>
        )}
        <SituationQuestions questions={ins.situationQuestions} />
      </section>

      <InstructionExplorer
        instruction={ins}
        approved={approved}
        lead={
          leadCfg
            ? { topic: leadCfg.topic, partnerName: leadCfg.partnerName, disclosure: leadCfg.visibleDisclosure, askEmail: leadCfg.formConfiguration.askEmail }
            : null
        }
        instructionTitles={instructionTitles}
        sourceNumbers={sourceNumbers}
        warningsSlot={<WarningsSection warnings={ins.warnings} sourceNumbers={sourceNumbers} expert={ex} />}
        freeHelpSlot={<FreeHelpList items={ins.freeHelp} />}
      />

      {ex && <ExpertCard expert={ex.expert} placeholder={ex.placeholder} reviewedAt={v.reviewed ? ins.legalReviewedAt : null} />}

      <SourcesSection
        sources={ins.sourceReferences}
        researchedAt={ins.researchedAt}
        legalReviewedAt={ins.legalReviewedAt}
        legalReviewedBy={ins.legalReviewedBy}
        legalStatusNote={ins.legalStatusNote}
        pendingVerification={ins.pendingVerification}
        reviewed={v.reviewed}
      />

      {(relatedQuestions.length > 0 || related.length > 0) && (
        <section aria-labelledby="powiazane" className="no-print border-t border-line py-12 sm:py-16">
          <h2 id="powiazane" className="text-h2 font-extrabold">
            Powiązane
          </h2>
          {relatedQuestions.length > 0 && (
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {relatedQuestions.map((q) => (
                <li key={q.slug}>
                  <Link href={`/pytania/${q.slug}`} className="card flex min-h-14 items-center px-4 py-3 font-semibold no-underline hover:border-navy">
                    {q.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {related.length > 0 && (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((i) => (
                <li key={i.slug}>
                  <InstructionCard i={i} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </article>
  );
}
