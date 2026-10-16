export function SectionHeading({ letter, id, title, lead }: { letter: string; id: string; title: string; lead?: string }) {
  return (
    <div className="flex gap-5 sm:gap-7">
      <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border-2 border-navy text-xl font-extrabold sm:h-14 sm:w-14 sm:text-2xl">
        {letter}
      </span>
      <div>
        <h2 id={id} className="text-h2 font-extrabold">
          <span className="sr-only">Sekcja {letter}: </span>
          {title}
        </h2>
        {lead && <p className="mt-2 max-w-2xl text-muted">{lead}</p>}
      </div>
    </div>
  );
}
