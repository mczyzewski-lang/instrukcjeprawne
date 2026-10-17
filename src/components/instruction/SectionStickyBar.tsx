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
  const [pathOptions, setPathOptions] = useState<{ value: string; label: string }[]>([]);
  const [pathValue, setPathValue] = useState("");
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
      setPathValue(sel?.value ?? "");
      setPathOptions((prev) => {
        const next = sel ? Array.from(sel.options).map((o) => ({ value: o.value, label: o.text })) : [];
        return prev.length === next.length && prev.every((o, i) => o.value === next[i].value) ? prev : next;
      });
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
  const showPath = visible && (cur.symbol === "C" || cur.symbol === "D") && pathName && pathOptions.length > 1;

  return (
    <div
      className={`no-print fixed inset-x-0 z-20 border-b border-line bg-white transition-transform duration-150 ${visible ? "translate-y-0" : "-translate-y-full"}`}
      style={{ top: HEADER, height: BAR, visibility: visible ? "visible" : "hidden" }}
    >
      <nav aria-label="Bieżąca sekcja instrukcji" className="container-page flex h-full items-center gap-3">
        <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border-2 border-navy text-sm font-extrabold">
          {cur.symbol}
        </span>
        <p className={`min-w-0 truncate font-bold ${showPath ? "hidden md:block md:max-w-[16rem] md:flex-none" : "flex-1"}`} aria-live="polite">
          <span className="sr-only">Jesteś w sekcji: </span>
          {cur.title}
        </p>
        {showPath && (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <label htmlFor="pasek-wybor-drogi" className="hidden shrink-0 text-sm font-semibold text-muted sm:block">
              Wybierz instrukcję:
            </label>
            <select
              id="pasek-wybor-drogi"
              value={pathValue}
              onChange={(e) => {
                setPathValue(e.target.value);
                setPathName(e.target.selectedOptions[0]?.text ?? "");
                window.dispatchEvent(new CustomEvent("ip:select-path", { detail: e.target.value }));
              }}
              className="min-h-9 w-full min-w-0 truncate rounded-sm border-2 border-line bg-white px-2 text-sm font-semibold hover:border-navy"
            >
              {pathOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}
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
