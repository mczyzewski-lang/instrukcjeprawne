import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { CategoryCard, InstructionCard } from "@/components/ui/Cards";
import { Illustration } from "@/components/ui/Illustration";
import { SearchBox } from "@/components/ui/SearchBox";
import { StepNumber } from "@/components/ui/StepNumber";
import { FEATURED_SLUGS } from "@/content";
import { CATEGORIES } from "@/content/categories";
import { listPublicInstructions } from "@/lib/repo/content";
import { buildSearchDocs } from "@/lib/search-index";

export const revalidate = 300;

const POPULAR = [
  { q: "komornik zajął konto", label: "Komornik zajął konto" },
  { q: "nakaz zapłaty", label: "Dostałem nakaz zapłaty" },
  { q: "upadłość konsumencka", label: "Upadłość konsumencka" },
  { q: "rozwód bez winy", label: "Rozwód bez winy" },
];

const HOW = [
  { title: "Odpowiedz na kilka pytań", text: "Bez rejestracji. Pytania pomagają rozpoznać Twoją sytuację.", ill: "person-question" },
  { title: "Zobacz możliwe drogi", text: "Każda droga z warunkami, kosztami i ryzykiem – także te bezpłatne.", ill: "two-paths" },
  { title: "Działaj krok po kroku", text: "Konkretne czynności, lista dokumentów i terminy. Do pobrania jako PDF.", ill: "checklist" },
];

export default function HomePage() {
  const instructions = listPublicInstructions().map((v) => v.doc);
  const bySlug = new Map(instructions.map((i) => [i.slug, i]));
  const featured = FEATURED_SLUGS.map((s) => bySlug.get(s)).filter((i) => i !== undefined);
  const docs = buildSearchDocs();

  return (
    <>
      <section className="border-b border-line">
        <div className="container-page grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.25fr_1fr] lg:py-24">
          <div>
            <h1 className="text-display font-extrabold">
              Trudna sprawa.
              <br />
              Prosta instrukcja.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted sm:text-xl">
              Dowiedz się krok po kroku, jakie masz możliwości. Bez skomplikowanego języka prawniczego. Bezpłatnie.
            </p>
            <div className="mt-10 max-w-2xl">
              <SearchBox docs={docs} />
              <ul className="mt-4 flex flex-wrap gap-2" aria-label="Często szukane">
                {POPULAR.map((p) => (
                  <li key={p.q}>
                    <Link href={`/szukaj?q=${encodeURIComponent(p.q)}`} className="badge min-h-9 px-3 py-1.5 text-sm font-semibold text-navy no-underline hover:border-navy">
                      {p.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="hidden lg:block">
            <Illustration id="documents-collect" decorative className="mx-auto max-w-md" />
          </div>
        </div>
      </section>

      <section aria-labelledby="jak" className="border-b border-line bg-white">
        <div className="container-page py-12 sm:py-16">
          <h2 id="jak" className="sr-only">
            Jak działa instrukcja
          </h2>
          <ol className="grid gap-10 sm:grid-cols-3">
            {HOW.map((h, i) => (
              <li key={h.title} className="flex gap-5 sm:flex-col sm:gap-4">
                <StepNumber n={i + 1} size="md" />
                <div>
                  <p className="text-lg font-extrabold">{h.title}</p>
                  <p className="mt-1 text-muted">{h.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="kategorie" className="container-page py-14 sm:py-20">
        <p className="eyebrow">Kategorie</p>
        <h2 id="kategorie" className="mt-2 text-h2 font-extrabold">
          Z czym masz problem?
        </h2>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((c) => (
            <li key={c.slug}>
              <CategoryCard c={c} count={instructions.filter((i) => i.category === c.slug).length} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="najwazniejsze" className="container-page pb-14 sm:pb-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Instrukcje</p>
            <h2 id="najwazniejsze" className="mt-2 text-h2 font-extrabold">
              Najważniejsze instrukcje
            </h2>
          </div>
          <Link href="/instrukcje" className="btn btn-ghost">
            Wszystkie instrukcje <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((i) => (
            <li key={i.slug}>
              <InstructionCard i={i} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="pilne" className="border-y border-line bg-white">
        <div className="container-page grid gap-8 py-12 sm:py-16 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="eyebrow">Pilne</p>
            <h2 id="pilne" className="mt-2 text-h2 font-extrabold">
              Masz pismo z sądu? Sprawdź termin.
            </h2>
            <p className="mt-3 text-muted">Niektóre terminy liczy się w dniach. Po ich upływie trudno coś zmienić.</p>
          </div>
          <ul className="grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-3">
            {[
              { days: "14", unit: "dni", title: "Nakaz zapłaty z sądu", text: "2 tygodnie od odebrania na sprzeciw lub zarzuty.", href: "/pytania/co-zrobic-po-otrzymaniu-nakazu-zaplaty" },
              { days: "7", unit: "dni", title: "Czynność komornika", text: "Tydzień na skargę na wadliwą czynność.", href: "/pytania/jak-dziala-skarga-na-komornika" },
              { days: "14", unit: "dni roboczych", title: "Wezwanie z banku", text: "Co najmniej tyle na spłatę i wniosek o restrukturyzację.", href: "/instrukcje/co-zrobic-gdy-nie-mozesz-splacac-rat-kredytu" },
            ].map((d) => (
              <li key={d.title} className="bg-white">
                <Link href={d.href} className="block h-full p-5 no-underline hover:bg-canvas">
                  <span className="text-4xl font-extrabold tabular-nums">{d.days}</span> <span className="font-semibold text-muted">{d.unit}</span>
                  <span className="mt-3 block font-bold">{d.title}</span>
                  <span className="mt-1 block text-sm text-muted">{d.text}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="zasady" className="container-page py-14 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <h2 id="zasady" className="text-h2 font-extrabold">
              Uczciwie i bez ukrytego celu
            </h2>
          </div>
          <ul className="grid gap-6 sm:grid-cols-3 lg:col-span-2">
            <li>
              <p className="font-extrabold">Bezpłatne drogi na równi z płatnymi</p>
              <p className="mt-1 text-sm text-muted">Pokazujemy, co możesz zrobić sam i gdzie dostaniesz bezpłatną pomoc.</p>
            </li>
            <li>
              <p className="font-extrabold">Źródła przy każdej instrukcji</p>
              <p className="mt-1 text-sm text-muted">Linki do przepisów i stron urzędów oraz data weryfikacji.</p>
            </li>
            <li>
              <p className="font-extrabold">Jasno o współpracy</p>
              <p className="mt-1 text-sm text-muted">Rozmowę z ekspertem mogą prowadzić podmioty komercyjne. Mówimy o tym wprost.</p>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
