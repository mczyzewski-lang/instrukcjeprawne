import { PlayCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ExpertAvatar } from "@/components/instruction/Expert";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { StepNumber } from "@/components/ui/StepNumber";
import { CATEGORIES } from "@/content/categories";
import { showUnreviewed } from "@/lib/config";
import { getFoundersVideo, listExperts } from "@/lib/repo/experts";

export const metadata: Metadata = {
  title: "Jak to działa?",
  description: "Po co powstały InstrukcjePrawne.pl, jak zbudowana jest instrukcja, skąd bierzemy informacje, kto je sprawdza i jak działa współpraca z ekspertami.",
  alternates: { canonical: "/jak-to-dziala" },
};
export const revalidate = 300;

const PRINCIPLES = [
  ["Problem, nie usługa", "Każda instrukcja zaczyna się od pytania, które zadajesz sam sobie – „jak wyjść z długów?”, a nie od nazwy procedury prawnej."],
  ["Wszystkie drogi, także bezpłatne", "Pokazujemy, co możesz zrobić samodzielnie, gdzie dostaniesz bezpłatną pomoc i kiedy warto mieć wsparcie specjalisty."],
  ["Mało tekstu, dużo konkretu", "Duże numery kroków, rysunki, listy dokumentów i terminy. Instrukcję można wydrukować albo pobrać jako PDF – bez podawania e-maila."],
  ["Bez straszenia i obietnic", "Nie obiecujemy wyników spraw, nie publikujemy opinii klientów ani statystyk skuteczności. Mówimy wprost, czego nie wiemy."],
];

const SECTIONS = [
  ["A", "Zrozum swoją sytuację", "Kilka prostych pytań, które pomagają się zorientować."],
  ["B", "Poznaj możliwe drogi", "Mapa rozwiązań z warunkami, kosztami i ryzykiem – także bezpłatnych."],
  ["C", "Instrukcja krok po kroku", "Konkretne czynności z ilustracjami. Postęp zapamiętujemy na Twoim urządzeniu."],
  ["D", "Co przygotować?", "Lista dokumentów do odhaczania i zapisania jako PDF."],
  ["E", "Na co uważać?", "Najczęstsze błędy, których trudno później uniknąć."],
  ["F", "Potrzebujesz pomocy?", "Bezpłatne punkty pomocy i – jeśli chcesz – czat z ekspertem nadzorującym dział."],
];

const VERIFICATION = [
  ["Research w źródłach urzędowych", "Korzystamy przede wszystkim z gov.pl, ISAP, stron sądów, UPRP, UOKiK, Rzecznika Finansowego. Projekty ustaw i zapowiedzi zmian nie są traktowane jako obowiązujące prawo."],
  ["Oznaczanie niepewności", "Przy każdym źródle podajemy datę sprawdzenia i poziom potwierdzenia. Rzeczy niepotwierdzone wypisujemy osobno – nie publikujemy ich jako faktów."],
  ["Zatwierdzenie przez człowieka", "Treści przygotowane z pomocą AI mają status roboczy. Dopiero osoba nadzorująca dział zatwierdza je w panelu redakcyjnym – wtedy pojawia się data weryfikacji."],
];

const NAV = [
  ["o-serwisie", "Po co jest serwis"],
  ["budowa", "Z czego składa się instrukcja"],
  ["zrodla", "Źródła i weryfikacja"],
  ["eksperci", "Kto nadzoruje treści"],
  ["wspolpraca", "Eksperci i współpraca"],
];

export default function HowItWorks() {
  const video = getFoundersVideo();
  const experts = listExperts().filter((e) => e.status === "published" || showUnreviewed());
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ name: "Jak to działa?", href: "/jak-to-dziala" }]} />

      <section id="o-serwisie" aria-labelledby="o-serwisie-h" className="mt-8 grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div>
          <p className="eyebrow">Jak to działa?</p>
          <h1 id="o-serwisie-h" className="mt-2 text-h1 font-extrabold">Nie uczymy prawa. Pokazujemy, co zrobić.</h1>
          <p className="mt-5 text-lg text-muted">
            InstrukcjePrawne.pl powstały dla osób, które dostały pismo z sądu, od komornika albo z banku i nie wiedzą, od czego zacząć. Zamiast artykułu na
            dziesięć stron dostajesz instrukcję: jakie masz możliwości, czym się różnią, co zrobić najpierw i czego unikać.
          </p>
          <p className="mt-4 text-lg text-muted">
            Inspiracją były instrukcje montażu: mało słów, duże numery kroków i rysunki, które da się zrozumieć bez czytania. Prawo zostaje prawem – my
            pokazujemy, jak przejść przez nie krok po kroku.
          </p>
          <nav aria-label="Na tej stronie" className="mt-6">
            <ul className="flex flex-wrap gap-2">
              {NAV.filter(([id]) => id !== "eksperci" || experts.length > 0).map(([id, label]) => (
                <li key={id}>
                  <a href={`#${id}`} className="badge min-h-9 px-3 text-sm text-navy no-underline hover:border-navy">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <figure className="mx-auto w-full max-w-md">
          <div className="relative aspect-square w-full overflow-hidden rounded-md border border-line bg-white">
            {video ? (
              /\.(mp4|webm)(\?|$)/i.test(video.url) ? (
                <video controls preload="none" poster={video.poster} className="h-full w-full object-cover" src={video.url}>
                  Twoja przeglądarka nie odtwarza wideo.
                </video>
              ) : (
                <a href={video.url} target="_blank" rel="noopener noreferrer" className="flex h-full w-full flex-col items-center justify-center gap-3 no-underline">
                  <PlayCircle className="h-16 w-16" aria-hidden="true" />
                  <span className="font-bold">Obejrzyj film</span>
                  <span className="sr-only">(otwiera się w nowej karcie)</span>
                </a>
              )
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-8 text-center">
                <PlayCircle className="h-16 w-16 text-muted" aria-hidden="true" />
                <p className="font-bold">Tu pojawi się film od założycieli</p>
                <p className="text-sm text-muted">Kilka minut o tym, dlaczego powstał serwis i jak z niego korzystać.</p>
              </div>
            )}
          </div>
          <figcaption className="mt-3 text-sm text-muted">{video?.title ?? "Film od założycieli – w przygotowaniu"}</figcaption>
          {video?.transcript && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-bold underline">Transkrypcja</summary>
              <p className="mt-2 whitespace-pre-line text-sm">{video.transcript}</p>
            </details>
          )}
        </figure>
      </section>

      <section aria-labelledby="zasady" className="mt-20">
        <h2 id="zasady" className="text-h2 font-extrabold">Na czym opiera się serwis</h2>
        <ol className="mt-8 grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {PRINCIPLES.map(([t, d], i) => (
            <li key={t} className="bg-white p-6">
              <StepNumber n={i + 1} size="sm" />
              <p className="mt-4 text-lg font-extrabold">{t}</p>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          <div>
            <h3 className="text-xl font-extrabold">Dla kogo</h3>
            <ul className="list-dash mt-4">
              <li>Dla osób, które mają problem prawny i chcą zrozumieć swoje możliwości, zanim cokolwiek podpiszą.</li>
              <li>Dla tych, którzy chcą działać samodzielnie – i potrzebują listy kroków oraz dokumentów.</li>
              <li>Dla tych, którzy wolą skorzystać z pomocy – i chcą wiedzieć, o co pytać.</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-extrabold">Czym nie jesteśmy</h3>
            <ul className="list-dash mt-4">
              <li>Nie jesteśmy kancelarią i nie udzielamy indywidualnych porad prawnych.</li>
              <li>Instrukcja nie zastępuje analizy Twoich dokumentów – pomaga ją dobrze przygotować.</li>
              <li>Nie zbieramy danych, żeby udostępnić Ci instrukcję.</li>
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="budowa" className="mt-20">
        <h2 id="budowa" className="text-h2 font-extrabold">Z czego składa się instrukcja</h2>
        <p className="mt-2 max-w-2xl text-muted">Każda instrukcja ma te same sekcje, w tej samej kolejności – gdy poznasz jedną, odnajdziesz się w każdej.</p>
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

      <section id="zrodla" aria-labelledby="zrodla-h" className="mt-20">
        <h2 id="zrodla-h" className="text-h2 font-extrabold">Źródła i weryfikacja treści</h2>
        <ol className="mt-8 grid gap-8 lg:grid-cols-3">
          {VERIFICATION.map(([t, d], i) => (
            <li key={t} className="flex gap-5">
              <StepNumber n={i + 1} size="sm" />
              <div>
                <p className="font-extrabold">{t}</p>
                <p className="mt-1 text-muted">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {experts.length > 0 && (
        <section id="eksperci" aria-labelledby="eksperci-h" className="mt-20">
          <h2 id="eksperci-h" className="text-h2 font-extrabold">Kto nadzoruje treści</h2>
          <p className="mt-2 max-w-2xl text-muted">
            Każdy dział ma osobę odpowiedzialną za poprawność merytoryczną. Spotkasz ją w każdej instrukcji ze swojego działu – i to ona odpowiada na pytania w
            czacie z ekspertem.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {experts.map((e) => (
              <li key={e.id} className="card flex gap-4 p-5">
                <ExpertAvatar expert={e} size={64} />
                <div>
                  <p className="font-extrabold">{e.name}</p>
                  <p className="text-sm text-muted">{e.title}</p>
                  <p className="mt-2 text-sm">{e.categories.map((c) => CATEGORIES.find((x) => x.slug === c)?.name).filter(Boolean).join(", ")}</p>
                  {e.status !== "published" && <p className="mt-2 text-xs font-semibold">Dane do uzupełnienia</p>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section id="wspolpraca" aria-labelledby="wspolpraca-h" className="mt-20 max-w-3xl">
        <h2 id="wspolpraca-h" className="text-h2 font-extrabold">Eksperci i współpraca</h2>
        <div className="mt-6 grid gap-4 text-muted">
          <p>
            Instrukcje mają być użyteczne także dla osób, które nigdy nie skorzystają z płatnej pomocy. Dlatego bezpłatne drogi – samodzielne działania,
            nieodpłatna pomoc prawna, Rzecznik Finansowy, rzecznicy konsumentów – pokazujemy na równi z innymi.
          </p>
          <p>
            W niektórych tematach możesz porozmawiać z ekspertem. Rozmowę prowadzi współpracujący z portalem podmiot komercyjny (np. Pravna, Nowy Etap), a dalsza
            pomoc może być odpłatna. Informujemy o tym zawsze przy czacie i formularzu.
          </p>
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
