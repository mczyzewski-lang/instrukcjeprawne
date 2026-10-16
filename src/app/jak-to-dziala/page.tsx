import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Illustration } from "@/components/ui/Illustration";
import { StepNumber } from "@/components/ui/StepNumber";

export const metadata: Metadata = {
  title: "Jak to działa?",
  description: "Jak powstają instrukcje, skąd bierzemy informacje, kto je sprawdza i jak działa współpraca z ekspertami.",
  alternates: { canonical: "/jak-to-dziala" },
};

const SECTIONS = [
  ["A", "Zrozum swoją sytuację", "Kilka prostych pytań, które pomagają się zorientować."],
  ["B", "Poznaj możliwe drogi", "Mapa rozwiązań z warunkami, kosztami i ryzykiem – także bezpłatnych."],
  ["C", "Instrukcja krok po kroku", "Konkretne czynności z ilustracjami. Postęp zapamiętujemy na Twoim urządzeniu."],
  ["D", "Co przygotować?", "Lista dokumentów do odhaczania i zapisania jako PDF."],
  ["E", "Na co uważać?", "Najczęstsze błędy, których trudno później uniknąć."],
  ["F", "Potrzebujesz pomocy?", "Bezpłatne punkty pomocy i – jeśli chcesz – rozmowa z ekspertem."],
];

export default function HowItWorks() {
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ name: "Jak to działa?", href: "/jak-to-dziala" }]} />
      <div className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <div>
          <h1 className="text-h1 font-extrabold">Nie uczymy prawa. Pokazujemy, co zrobić.</h1>
          <p className="mt-4 text-lg text-muted">
            InstrukcjePrawne.pl to system instrukcji rozwiązywania problemów prawnych. Każda instrukcja jest zbudowana tak samo – jak instrukcja montażu:
            mało tekstu, duże numery kroków, rysunki i jasny podział na to, co zrobisz sam, i to, gdzie warto mieć wsparcie.
          </p>
        </div>
        <Illustration id="two-paths" decorative className="mx-auto hidden max-w-sm lg:block" />
      </div>

      <section aria-labelledby="budowa" className="mt-16">
        <h2 id="budowa" className="text-h2 font-extrabold">Z czego składa się instrukcja</h2>
        <ol className="mt-8 grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map(([l, t, d]) => (
            <li key={l} className="bg-white p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-sm border-2 border-navy text-lg font-extrabold">{l}</span>
              <p className="mt-4 text-lg font-extrabold">{t}</p>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="zrodla" aria-labelledby="zrodla-h" className="mt-16 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 id="zrodla-h" className="text-h2 font-extrabold">Źródła i weryfikacja treści</h2>
          <ol className="mt-8 grid gap-8">
            {[
              ["Research w źródłach urzędowych", "Korzystamy przede wszystkim z gov.pl, ISAP, stron sądów, UPRP, UOKiK, Rzecznika Finansowego. Projekty ustaw i zapowiedzi zmian nie są traktowane jako obowiązujące prawo."],
              ["Oznaczanie niepewności", "Przy każdym źródle podajemy datę sprawdzenia i poziom potwierdzenia. Rzeczy niepotwierdzone wypisujemy osobno – nie publikujemy ich jako faktów."],
              ["Zatwierdzenie przez człowieka", "Treści przygotowane z pomocą AI mają status roboczy. Dopiero prawnik zatwierdza je w panelu redakcyjnym – wtedy pojawia się data weryfikacji."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-5">
                <StepNumber n={i + 1} size="sm" />
                <div>
                  <p className="font-extrabold">{t}</p>
                  <p className="mt-1 text-muted">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h2 className="text-h2 font-extrabold">Eksperci i współpraca</h2>
          <div className="mt-8 grid gap-4 text-muted">
            <p>
              Instrukcje mają być użyteczne także dla osób, które nigdy nie skorzystają z płatnej pomocy. Dlatego bezpłatne drogi – samodzielne działania,
              nieodpłatna pomoc prawna, Rzecznik Finansowy, rzecznicy konsumentów – pokazujemy na równi z innymi.
            </p>
            <p>
              W niektórych tematach możesz poprosić o bezpłatną rozmowę z ekspertem. Rozmowę prowadzi współpracujący z portalem podmiot komercyjny (np. Pravna,
              Nowy Etap), a dalsza pomoc może być odpłatna. Informujemy o tym zawsze przy formularzu.
            </p>
            <p>Nie publikujemy opinii klientów, statystyk skuteczności ani obietnic wyniku sprawy.</p>
          </div>
        </div>
      </section>

      <section className="mt-16 rounded-md border border-line bg-white p-6">
        <p className="font-extrabold">Informacje ogólne, nie porada prawna</p>
        <p className="mt-2 text-sm text-muted">
          Instrukcje opisują typowe sytuacje i nie zastępują analizy Twoich dokumentów. Jeśli biegnie termin sądowy lub grozi Ci nieodwracalny skutek, sprawdź
          swoją sytuację szybko – np. w <Link href="/pytania/gdzie-znalezc-bezplatna-pomoc-prawna">bezpłatnym punkcie pomocy prawnej</Link>.
        </p>
      </section>
    </div>
  );
}
