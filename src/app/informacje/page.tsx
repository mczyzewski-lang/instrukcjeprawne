import { PlayCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ExpertAvatar } from "@/components/instruction/Expert";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { StepNumber } from "@/components/ui/StepNumber";
import { CATEGORIES } from "@/content/categories";
import { getFoundersVideo, listExperts } from "@/lib/repo/experts";
import { showUnreviewed } from "@/lib/config";

export const metadata: Metadata = {
  title: "Informacje",
  description: "Po co powstały InstrukcjePrawne.pl, jak działają i kto za nimi stoi.",
  alternates: { canonical: "/informacje" },
};
export const revalidate = 300;

const PRINCIPLES = [
  ["Problem, nie usługa", "Każda instrukcja zaczyna się od pytania, które zadajesz sam sobie – „jak wyjść z długów?”, a nie od nazwy procedury prawnej."],
  ["Wszystkie drogi, także bezpłatne", "Pokazujemy, co możesz zrobić samodzielnie, gdzie dostaniesz bezpłatną pomoc i kiedy warto mieć wsparcie specjalisty."],
  ["Mało tekstu, dużo konkretu", "Duże numery kroków, rysunki, listy dokumentów i terminy. Instrukcję można wydrukować albo pobrać jako PDF."],
  ["Źródła i odpowiedzialność", "Każda instrukcja ma źródła urzędowe, datę weryfikacji i osobę, która nadzoruje dział merytorycznie."],
  ["Bez straszenia i obietnic", "Nie obiecujemy wyników spraw i nie publikujemy fikcyjnych opinii. Mówimy wprost, czego nie wiemy."],
  ["Jasno o współpracy", "W niektórych tematach możesz porozmawiać z ekspertem współpracującego podmiotu komercyjnego. Zawsze o tym informujemy."],
];

export default function InformationPage() {
  const video = getFoundersVideo();
  const experts = listExperts().filter((e) => e.status === "published" || showUnreviewed());
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ name: "Informacje", href: "/informacje" }]} />

      <section className="mt-8 grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div>
          <p className="eyebrow">O serwisie</p>
          <h1 className="mt-2 text-h1 font-extrabold">Trudna sprawa nie musi oznaczać trudnego języka.</h1>
          <p className="mt-5 text-lg text-muted">
            InstrukcjePrawne.pl powstały dla osób, które dostały pismo z sądu, od komornika albo z banku i nie wiedzą, od czego zacząć. Zamiast artykułu na
            dziesięć stron dostajesz instrukcję: jakie masz możliwości, czym się różnią, co zrobić najpierw i czego unikać.
          </p>
          <p className="mt-4 text-lg text-muted">
            Inspiracją były instrukcje montażu: mało słów, duże numery kroków i rysunki, które da się zrozumieć bez czytania. Prawo zostaje prawem – my
            pokazujemy, jak przejść przez nie krok po kroku.
          </p>
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
        <ol className="mt-8 grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {PRINCIPLES.map(([t, d], i) => (
            <li key={t} className="bg-white p-6">
              <StepNumber n={i + 1} size="sm" />
              <p className="mt-4 text-lg font-extrabold">{t}</p>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="dla-kogo" className="mt-20 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 id="dla-kogo" className="text-h2 font-extrabold">Dla kogo</h2>
          <ul className="list-dash mt-6">
            <li>Dla osób, które mają problem prawny i chcą zrozumieć swoje możliwości, zanim cokolwiek podpiszą.</li>
            <li>Dla tych, którzy chcą działać samodzielnie – i potrzebują listy kroków oraz dokumentów.</li>
            <li>Dla tych, którzy wolą skorzystać z pomocy – i chcą wiedzieć, o co pytać.</li>
          </ul>
        </div>
        <div>
          <h2 className="text-h2 font-extrabold">Czym nie jesteśmy</h2>
          <ul className="list-dash mt-6">
            <li>Nie jesteśmy kancelarią i nie udzielamy indywidualnych porad prawnych.</li>
            <li>Instrukcja nie zastępuje analizy Twoich dokumentów – pomaga ją dobrze przygotować.</li>
            <li>Nie zbieramy danych, żeby udostępnić Ci instrukcję. PDF pobierzesz bez e-maila.</li>
          </ul>
        </div>
      </section>

      {experts.length > 0 && (
        <section aria-labelledby="eksperci" className="mt-20">
          <h2 id="eksperci" className="text-h2 font-extrabold">Kto nadzoruje treści</h2>
          <p className="mt-2 max-w-2xl text-muted">Każdy dział ma osobę odpowiedzialną za poprawność merytoryczną. Treści przygotowane z pomocą narzędzi AI publikujemy dopiero po jej weryfikacji.</p>
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

      <section className="mt-20 rounded-md border border-line bg-white p-6">
        <p className="font-extrabold">Chcesz wiedzieć więcej o tym, jak powstają instrukcje?</p>
        <p className="mt-2 text-sm text-muted">
          Opisujemy to w zakładce <Link href="/jak-to-dziala">Jak to działa?</Link> – razem z zasadami weryfikacji źródeł i współpracy z ekspertami.
        </p>
      </section>
    </div>
  );
}
