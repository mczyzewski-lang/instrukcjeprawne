import type { Expert } from "@/lib/types";

/**
 * Ekspert nadzorujący merytorycznie – spokojna, powtarzalna obecność w treści instrukcji.
 * Bez przycisków kontaktu i bez języka sprzedażowego: to informacja „kto odpowiada za treść”.
 */

function photoUrl(e: Expert) {
  return e.photoFile ? `/api/experts/${e.id}/photo?v=${encodeURIComponent(e.photoFile)}` : null;
}

export function ExpertAvatar({ expert, size = 40 }: { expert: Expert; size?: number }) {
  const url = photoUrl(expert);
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element -- zdjęcie z lokalnego magazynu
    <img src={url} alt={`Zdjęcie: ${expert.name}`} width={size} height={size} className="shrink-0 rounded-full border border-line object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-white text-navy" style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 40 40" width={size * 0.8} height={size * 0.8} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <circle cx="20" cy="15" r="6" />
        <path d="M9 34 v-3 a11 11 0 0 1 22 0 v3" />
      </svg>
    </span>
  );
}

function PlaceholderNote({ inline = true }: { inline?: boolean }) {
  return <span className={`${inline ? "ml-1 " : ""}rounded-sm bg-gold-soft px-1.5 py-0.5 text-[0.7rem] font-semibold text-navy`}>dane eksperta do uzupełnienia</span>;
}

/** Krótka linijka pod nagłówkiem sekcji. */
export function ExpertByline({ expert, placeholder, label = "Merytorycznie nadzoruje" }: { expert: Expert; placeholder: boolean; label?: string }) {
  return (
    <p className="flex items-center gap-3 text-sm text-muted">
      <ExpertAvatar expert={expert} size={36} />
      <span>
        {label}: <span className="font-semibold text-navy">{expert.name}</span>
        {expert.title && !placeholder && <>, {expert.title}</>}
        {placeholder && <PlaceholderNote />}
      </span>
    </p>
  );
}

/** Pełna informacja przy źródłach – kto odpowiada za treść. */
export function ExpertCard({ expert, placeholder, reviewedAt }: { expert: Expert; placeholder: boolean; reviewedAt: string | null }) {
  const facts: [string, string][] = [
    ["Zakres", expert.role || "Nadzór merytoryczny nad działem"],
    ["Weryfikacja", reviewedAt ? `ostatnia: ${reviewedAt.split("-").reverse().join(".")}` : "ta wersja czeka na weryfikację"],
  ];
  if (expert.affiliation) facts.push(["Powiązania", expert.affiliation]);
  return (
    <section aria-labelledby="ekspert-h" className="border-t border-line py-12 sm:py-16">
      <h2 id="ekspert-h" className="text-h2 font-extrabold">
        Kto odpowiada za tę instrukcję
      </h2>
      <div className="card mt-8 max-w-3xl p-5 sm:p-7">
        <div className="flex items-center gap-4 sm:gap-5">
          <ExpertAvatar expert={expert} size={80} />
          <div className="min-w-0">
            <p className="text-lg font-extrabold leading-snug sm:text-xl">{expert.name}</p>
            {expert.title && <p className="text-sm text-muted">{expert.title}</p>}
            {placeholder && <p className="mt-1.5"><PlaceholderNote inline={false} /></p>}
          </div>
        </div>
        {expert.bio && <p className="mt-5 max-w-prose">{expert.bio}</p>}
        <dl className="mt-5 grid gap-x-6 gap-y-2 border-t border-line pt-5 text-sm sm:grid-cols-[7rem_1fr]">
          {facts.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="font-semibold">{k}</dt>
              <dd className="text-muted">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 text-xs text-muted">
          Sprawdza poprawność instrukcji, ostrzeżeń i źródeł w tym dziale. Instrukcja nie jest indywidualną poradą, a jej czytanie nie oznacza nawiązania
          współpracy z ekspertem.
        </p>
      </div>
    </section>
  );
}
