import { ExternalLink, PlayCircle } from "lucide-react";
import type { RelatedVideo } from "@/lib/types";

const PLATFORM: Record<RelatedVideo["platform"], string> = { own: "Film", instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube" };

/**
 * Film jest dodatkiem – odpowiedź zawsze jest pełna bez niego.
 * Nie osadzamy skryptów platform społecznościowych (prywatność, wydajność) – podajemy link i transkrypcję.
 */
export function VideoBlock({ video }: { video: RelatedVideo }) {
  return (
    <section aria-labelledby="film" className="card mt-10 p-5">
      <h2 id="film" className="flex items-center gap-2 text-lg font-extrabold">
        <PlayCircle className="h-5 w-5" aria-hidden="true" /> {video.title}
      </h2>
      {video.platform === "own" ? (
        <video controls preload="none" className="mt-4 w-full rounded-md" src={video.url}>
          Twoja przeglądarka nie odtwarza wideo. <a href={video.url}>Pobierz film</a>.
        </video>
      ) : (
        <a href={video.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary mt-4">
          Obejrzyj na {PLATFORM[video.platform]} <ExternalLink className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">(otwiera się w nowej karcie)</span>
        </a>
      )}
      {video.publishedAt && <p className="mt-2 text-xs text-muted">Opublikowano: {video.publishedAt.split("-").reverse().join(".")}</p>}
      {video.transcript && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-bold underline">Transkrypcja</summary>
          <p className="mt-2 whitespace-pre-line text-sm">{video.transcript}</p>
        </details>
      )}
    </section>
  );
}
