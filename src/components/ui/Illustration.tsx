import { getIllustration, illustrationInnerSvg, VIEWBOX } from "@/illustrations/library";

interface Props {
  id: string;
  /** zatwierdzona grafika z generatora lub upload – ma pierwszeństwo przed SVG */
  approved?: { id: string; alt: string } | null;
  alt?: string;
  className?: string;
  /** dekoracyjna – ukryta przed czytnikami (gdy obok jest pełny opis) */
  decorative?: boolean;
}

/** Ilustracja instruktażowa: zatwierdzona grafika albo SVG z biblioteki. Zawsze z tekstem alternatywnym. */
export function Illustration({ id, approved, alt, className = "", decorative = false }: Props) {
  const def = getIllustration(id);
  if (approved) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- grafiki z lokalnego magazynu, rozmiar stały
      <img
        src={`/api/illustrations/${approved.id}`}
        alt={decorative ? "" : approved.alt}
        width={480}
        height={320}
        loading="lazy"
        decoding="async"
        className={`h-auto w-full object-contain ${className}`}
      />
    );
  }
  const label = alt || def.alt;
  return (
    <span className={`illustration block text-navy ${className}`}>
      <svg
        viewBox={VIEWBOX}
        role={decorative ? undefined : "img"}
        aria-hidden={decorative ? true : undefined}
        aria-label={decorative ? undefined : label}
        dangerouslySetInnerHTML={{ __html: illustrationInnerSvg(def.id) }}
      />
    </span>
  );
}
