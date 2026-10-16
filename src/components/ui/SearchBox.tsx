"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { track } from "@/lib/analytics-client";
import { prepare, search, type SearchDoc } from "@/lib/search";

const TYPE_LABEL: Record<SearchDoc["type"], string> = { instruction: "Instrukcja", question: "Pytanie", path: "Droga" };

interface Props {
  docs: SearchDoc[];
  size?: "lg" | "md";
  label?: string;
  placeholder?: string;
  initialQuery?: string;
}

/** Wyszukiwarka z podpowiedziami (wzorzec ARIA combobox). Działa też bez JS jako zwykły formularz GET. */
export function SearchBox({ docs, size = "lg", label = "Jaki problem chcesz rozwiązać?", placeholder = "Np. mam długi i nie wiem, co dalej…", initialQuery = "" }: Props) {
  const router = useRouter();
  const index = useMemo(() => prepare(docs), [docs]);
  const [q, setQ] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const inputId = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const hits = useMemo(() => (q.trim().length >= 2 ? search(index, q, 6) : []), [index, q]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (active >= 0 && hits[active]) {
      go(hits[active].url);
      return;
    }
    if (!q.trim()) return;
    track("search_performed", { props: { query_length: q.trim().length, results: hits.length, source: "box" } });
    router.push(`/szukaj?q=${encodeURIComponent(q.trim())}`);
  };

  const go = (url: string) => {
    track("search_performed", { props: { query_length: q.trim().length, results: hits.length, source: "suggestion" } });
    setOpen(false);
    router.push(url);
  };

  const big = size === "lg";
  return (
    <div ref={wrap} className="relative w-full">
      <form action="/szukaj" method="get" role="search" onSubmit={submit}>
        <label htmlFor={inputId} className={big ? "mb-3 block text-lg font-bold sm:text-xl" : "sr-only"}>
          {label}
        </label>
        <div className="flex items-stretch rounded-md border-2 border-navy bg-white focus-within:shadow-[0_0_0_4px_var(--color-gold-soft)]">
          <Search className={`${big ? "ml-4 h-6 w-6" : "ml-3 h-5 w-5"} shrink-0 self-center text-muted`} aria-hidden="true" />
          <input
            id={inputId}
            name="q"
            type="search"
            autoComplete="off"
            role="combobox"
            aria-expanded={open && hits.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            value={q}
            placeholder={placeholder}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
              setActive(-1);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setOpen(true);
                setActive((a) => Math.min(a + 1, hits.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, -1));
              } else if (e.key === "Escape") {
                setOpen(false);
                setActive(-1);
              }
            }}
            className={`min-w-0 flex-1 bg-transparent px-3 text-navy placeholder:text-muted focus:outline-none ${big ? "h-16 text-lg" : "h-12 text-base"}`}
          />
          <button type="submit" className={`m-1.5 rounded-sm bg-navy px-4 font-bold text-white hover:bg-navy-soft ${big ? "sm:px-6" : ""}`}>
            Szukaj
          </button>
        </div>
      </form>
      {open && hits.length > 0 && (
        <ul id={listId} role="listbox" aria-label="Podpowiedzi" className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-md border border-line bg-white">
          {hits.map((h, i) => (
            <li
              key={h.url}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                go(h.url);
              }}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer border-b border-line px-4 py-3 last:border-b-0 ${i === active ? "bg-canvas" : ""}`}
            >
              <span className="eyebrow mr-2 text-[0.65rem]">{TYPE_LABEL[h.type]}</span>
              <span className="font-semibold">{h.title}</span>
              <span className="mt-0.5 block truncate text-sm text-muted">{h.snippet}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
