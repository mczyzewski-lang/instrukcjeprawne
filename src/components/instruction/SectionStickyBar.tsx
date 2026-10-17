"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface StickySection {
  /** id nagłówka sekcji */
  id: string;
  /** symbol: litera sekcji albo znak (np. §) */
  symbol: string;
  title: string;
}

const HEADER = 64; // wysokość nagłówka serwisu
const BAR = 52;

/**
 * Pasek przyklejony pod nagłówkiem: pokazuje literę i nazwę sekcji, w której jest czytelnik,
 * oraz pozwala przejść do innej sekcji. Pojawia się dopiero po wejściu w sekcję A.
 */
export function SectionStickyBar({ sections }: { sections: StickySection[] }) {
  const [active, setActive] = useState<number>(-1);
  const [pathName, setPathName] = useState("");
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const els = sections.map((s) => document.getElementById(s.id)?.closest("section") ?? document.getElementById(s.id));
    const update = () => {
      frame = 0;
      const line = HEADER + BAR + 24;
      let idx = -1;
      els.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top <= line) idx = i;
      });
      // za ostatnią sekcją (np. „Powiązane”) pasek znika
      const last = els[els.length - 1];
      if (last && last.getBoundingClientRect().bottom < line) idx = -1;
      setActive(idx);
      const sel = document.getElementById("wybor-drogi") as HTMLSelectElement | null;
      setPathName(sel?.selectedOptions[0]?.text ?? "");
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    document.addEventListener("change", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("change", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [sections]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const visible = active >= 0;
  const cur = sections[Math.max(active, 0)];
  const showPath = visible && (cur.symbol === "C" || cur.symbol === "D") && pathName;

  return (
    <div
      className={`no-print fixed inset-x-0 z-20 border-b border-line bg-white transition-transform duration-150 ${visible ? "translate-y-0" : "-translate-y-full"}`}
      style={{ top: HEADER, height: BAR, visibility: visible ? "visible" : "hidden" }}
    >
      <nav aria-label="Bieżąca sekcja instrukcji" className="container-page flex h-full items-center gap-3">
        <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border-2 border-navy text-sm font-extrabold">
          {cur.symbol}
        </span>
        <p className="min-w-0 flex-1 truncate font-bold" aria-live="polite">
          <span className="sr-only">Jesteś w sekcji: </span>
          {cur.title}
          {showPath && <span className="hidden font-normal text-muted sm:inline"> · {pathName}</span>}
        </p>
        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            aria-expanded={open}
            aria-controls="spis-sekcji"
            onClick={() => setOpen((o) => !o)}
            className="flex min-h-9 items-center gap-1 rounded-sm border-2 border-line px-3 text-sm font-bold hover:border-navy"
          >
            Sekcje <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </button>
          {open && (
            <ul id="spis-sekcji" className="absolute right-0 top-11 w-72 rounded-md border border-line bg-white p-1.5">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    onClick={() => setOpen(false)}
                    aria-current={i === active ? "location" : undefined}
                    className={`flex min-h-11 items-center gap-3 rounded-sm px-2.5 text-sm no-underline hover:bg-canvas ${i === active ? "bg-canvas font-bold" : ""}`}
                  >
                    <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-navy text-xs font-extrabold">
                      {s.symbol}
                    </span>
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </nav>
    </div>
  );
}
