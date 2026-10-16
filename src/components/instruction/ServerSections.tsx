import { AlertTriangle, ExternalLink, Phone } from "lucide-react";
import Link from "next/link";
import type { FreeHelpResource, SourceReference, Warning } from "@/lib/types";
import { SectionHeading } from "./SectionHeading";

const CONFIDENCE: Record<SourceReference["confidence"], string> = {
  verified: "potwierdzone w źródle",
  partial: "potwierdzone częściowo",
  unverified: "do weryfikacji",
};

export const formatDate = (d: string | null | undefined) => {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  if (!m) return y;
  if (!day) return `${m}.${y}`;
  return `${day}.${m}.${y}`;
};

export function WarningsSection({ warnings, sourceNumbers }: { warnings: Warning[]; sourceNumbers: Record<string, number> }) {
  if (!warnings.length) return null;
  return (
    <section id="uwaga" aria-labelledby="sekcja-e" className="border-t border-line py-12 sm:py-16">
      <SectionHeading letter="E" id="sekcja-e" title="Na co uważać?" lead="Najczęstsze błędy, które trudno później odwrócić." />
      <ul className="mt-8 grid gap-3 md:grid-cols-2">
        {warnings.map((w) => (
          <li key={w.id} className={`rounded-md border bg-white p-5 ${w.severity === "urgent" ? "border-urgent" : "border-line"}`}>
            <p className="flex items-start gap-3 font-extrabold">
              <AlertTriangle className={`mt-0.5 h-5 w-5 shrink-0 ${w.severity === "urgent" ? "text-urgent" : "text-gold"}`} aria-hidden="true" />
              <span>
                {w.severity === "urgent" && <span className="sr-only">Pilne: </span>}
                {w.title}
              </span>
            </p>
            <p className="mt-2 pl-8 text-sm">
              {w.body}
              {(w.sourceReferences ?? [])
                .filter((id) => sourceNumbers[id])
                .map((id) => (
                  <a key={id} href={`#zrodlo-${id}`} className="ml-1 text-xs font-semibold text-muted no-underline hover:underline">
                    [{sourceNumbers[id]}]
                  </a>
                ))}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function FreeHelpList({ items }: { items: FreeHelpResource[] }) {
  return (
    <div>
      <p className="text-xl font-extrabold">Bezpłatna pomoc</p>
      <p className="mt-2 text-muted">Zanim skorzystasz z płatnej pomocy, sprawdź te możliwości.</p>
      <ul className="mt-5 grid gap-3">
        {items.map((h) => (
          <li key={h.name} className="card p-4">
            <p className="font-bold">{h.name}</p>
            <p className="mt-1 text-sm text-muted">{h.description}</p>
            <p className="mt-2 flex flex-wrap gap-4 text-sm font-semibold">
              {h.phone && (
                <a href={`tel:${h.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5">
                  <Phone className="h-4 w-4" aria-hidden="true" /> {h.phone}
                </a>
              )}
              {h.url && (
                <a href={h.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 break-all">
                  {new URL(h.url).hostname.replace(/^www\./, "")} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="sr-only">(otwiera się w nowej karcie)</span>
                </a>
              )}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SourcesSection({
  sources,
  researchedAt,
  legalReviewedAt,
  legalReviewedBy,
  legalStatusNote,
  pendingVerification,
  reviewed,
}: {
  sources: SourceReference[];
  researchedAt: string;
  legalReviewedAt: string | null;
  legalReviewedBy?: string | null;
  legalStatusNote: string;
  pendingVerification: string[];
  reviewed: boolean;
}) {
  return (
    <section id="zrodla" aria-labelledby="zrodla-h" className="border-t border-line py-12 sm:py-16">
      <h2 id="zrodla-h" className="text-h2 font-extrabold">
        Źródła i stan prawny
      </h2>
      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <dt className="eyebrow">Stan prawny na dzień</dt>
          <dd className="mt-1 text-lg font-extrabold">{formatDate(researchedAt)}</dd>
        </div>
        <div className="card p-4">
          <dt className="eyebrow">Weryfikacja przez prawnika</dt>
          <dd className="mt-1 text-lg font-extrabold">
            {reviewed && legalReviewedAt ? formatDate(legalReviewedAt) : <span className="text-base font-bold text-urgent">Oczekuje</span>}
          </dd>
          {reviewed && legalReviewedBy && <dd className="text-sm text-muted">{legalReviewedBy}</dd>}
        </div>
        <div className="card p-4">
          <dt className="eyebrow">Liczba źródeł</dt>
          <dd className="mt-1 text-lg font-extrabold">{sources.length}</dd>
        </div>
      </dl>
      <p className="mt-6 max-w-3xl text-sm">{legalStatusNote}</p>
      <ol className="mt-8 grid gap-3 text-sm">
        {sources.map((s, i) => (
          <li key={s.id} id={`zrodlo-${s.id}`} className="flex gap-3">
            <span className="w-7 shrink-0 font-extrabold tabular-nums text-muted">[{i + 1}]</span>
            <div className="min-w-0">
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-semibold break-words">
                {s.title}
              </a>
              <span className="text-muted"> – {s.publisher}</span>
              <p className="mt-0.5 text-xs text-muted">
                {s.publishedOrUpdated && <>Dokument: {formatDate(s.publishedOrUpdated)} · </>}
                Sprawdzono: {formatDate(s.verifiedAt)} · <span className={s.confidence === "unverified" ? "font-bold text-urgent" : ""}>{CONFIDENCE[s.confidence]}</span>
              </p>
              {s.supports && <p className="mt-1 text-xs">{s.supports}</p>}
              {s.note && <p className="mt-1 text-xs font-semibold">{s.note}</p>}
            </div>
          </li>
        ))}
      </ol>
      {pendingVerification.length > 0 && (
        <div className="mt-8 rounded-md border border-line bg-white p-5">
          <p className="font-extrabold">Czego jeszcze nie potwierdziliśmy</p>
          <p className="mt-1 text-sm text-muted">Te informacje celowo pominęliśmy lub opisaliśmy ogólnie, dopóki nie zostaną zweryfikowane:</p>
          <ul className="list-dash mt-3 text-sm">
            {pendingVerification.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-8 max-w-3xl text-sm text-muted">
        Ta instrukcja zawiera informacje ogólne i nie jest indywidualną opinią prawną. Przepisy i ich wykładnia mogą się zmieniać. W sprawach z krótkimi
        terminami lub ryzykiem nieodwracalnych skutków sprawdź swoją sytuację jak najszybciej – np. w{" "}
        <Link href="/pytania/gdzie-znalezc-bezplatna-pomoc-prawna">bezpłatnym punkcie pomocy prawnej</Link>.
      </p>
    </section>
  );
}
