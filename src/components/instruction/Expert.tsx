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

function PlaceholderNote() {
  return <span className="ml-1 rounded-sm bg-gold-soft px-1.5 py-0.5 text-[0.7rem] font-semibold text-navy">dane eksperta do uzupełnienia</span>;
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
  return (
    <section aria-labelledby="ekspert-h" className="border-t border-line py-12 sm:py-16">
      <h2 id="ekspert-h" className="text-h2 font-extrabold">
        Kto odpowiada za tę instrukcję
      </h2>
      <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start">
        <ExpertAvatar expert={expert} size={112} />
        <div className="max-w-2xl">
          <p className="text-xl font-extrabold">
            {expert.name}
            {placeholder && <PlaceholderNote />}
          </p>
          <p className="text-muted">{[expert.title, expert.role].filter(Boolean).join(" · ")}</p>
          <p className="mt-4">{expert.bio}</p>
          <ul className="list-dash mt-4 text-sm">
            <li>Sprawdza poprawność merytoryczną instrukcji, ostrzeżeń i źródeł w tym dziale.</li>
            <li>{reviewedAt ? `Ostatnia weryfikacja merytoryczna: ${reviewedAt.split("-").reverse().join(".")}.` : "Ta wersja instrukcji czeka jeszcze na weryfikację."}</li>
            {expert.affiliation && <li>Powiązania: {expert.affiliation}</li>}
          </ul>
          <p className="mt-4 text-xs text-muted">
            Ekspert nadzoruje treść instrukcji. Instrukcja nie jest indywidualną poradą, a czytanie jej nie oznacza nawiązania współpracy z ekspertem.
          </p>
        </div>
      </div>
    </section>
  );
}
