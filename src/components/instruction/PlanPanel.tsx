"use client";

import { Check, Download, MessageCircle, Printer, RefreshCw } from "lucide-react";
import type { Plan } from "@/lib/plan";

interface Props {
  plan: Plan;
  pdfHref: string;
  isDone: (id: string) => boolean;
  toggle: (id: string) => void;
  onRefresh: () => void;
  /** brak = w tej instrukcji nie ma kontaktu z ekspertem */
  onDiscuss?: () => void;
  onPdf?: () => void;
}

/** „Plan …” – pełna checklista złożona z odpowiedzi; odhaczenia kroków i dokumentów są wspólne z sekcjami C i D. */
export function PlanPanel({ plan, pdfHref, isDone, toggle, onRefresh, onDiscuss, onPdf }: Props) {
  const all = plan.sections.flatMap((s) => s.items);
  const doneCount = all.filter((i) => isDone(i.id)).length;
  const pct = all.length ? Math.round((doneCount / all.length) * 100) : 0;

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-line px-5 py-5 sm:px-7">
        <p className="eyebrow">Twój plan · {plan.instructionTitle}</p>
        <h3 className="mt-1 text-2xl font-extrabold sm:text-3xl">{plan.title}</h3>
        <p className="mt-1 text-sm text-muted">Droga: {plan.pathName}</p>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
            <div className="h-full bg-navy transition-[width]" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-semibold tabular-nums text-muted" aria-live="polite">
            {doneCount} z {all.length} zrobione
          </span>
        </div>
      </div>

      {(plan.situation.length > 0 || plan.decisions.length > 0) && (
        <details className="border-b border-line px-5 py-3 sm:px-7">
          <summary className="cursor-pointer text-sm font-bold">Na podstawie Twoich odpowiedzi ({plan.situation.length + plan.decisions.length})</summary>
          <ul className="mt-3 grid gap-2 text-sm">
            {plan.situation.map((s) => (
              <li key={s.question}>
                <span className="font-semibold">{s.question}</span> <span className="text-muted">– {s.answer}.</span> <span className="text-muted">{s.meaning}</span>
              </li>
            ))}
            {plan.decisions.map((d) => (
              <li key={d.question}>
                <span className="font-semibold">{d.question}</span> <span className="text-muted">– {d.answer}</span>
              </li>
            ))}
          </ul>
          {plan.uncertain && <p className="mt-3 text-sm font-semibold">Część odpowiedzi to „nie wiem” – plan jest niepełny.</p>}
        </details>
      )}

      <div className="grid gap-8 px-5 py-6 sm:px-7">
        {plan.sections.map((s) => (
          <section key={s.id} aria-label={s.title}>
            <h4 className={`text-sm font-extrabold uppercase tracking-wider ${s.id === "pilne" ? "text-urgent" : "text-muted"}`}>{s.title}</h4>
            <ul className="mt-3 grid gap-2">
              {s.items.map((it) => {
                const on = isDone(it.id);
                return (
                  <li key={it.id}>
                    <label className={`flex cursor-pointer items-start gap-3 rounded-md border-2 bg-white px-4 py-3 ${on ? "border-navy" : it.urgent ? "border-urgent/40" : "border-line"}`}>
                      <input type="checkbox" checked={on} onChange={() => toggle(it.id)} className="mt-1 h-5 w-5 shrink-0 accent-navy" />
                      <span className="min-w-0">
                        <span className={`block font-semibold ${on ? "line-through decoration-gold decoration-2" : ""}`}>{it.label}</span>
                        {it.detail && <span className="mt-0.5 block text-sm text-muted">{it.detail}</span>}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <div className="no-print grid gap-3 border-t border-line bg-canvas px-5 py-5 sm:px-7">
        {onDiscuss && (
          <button type="button" className="btn btn-primary w-full sm:w-auto sm:justify-self-start" onClick={onDiscuss}>
            <MessageCircle className="h-4 w-4" aria-hidden="true" /> Omów bezpłatnie {plan.title} z ekspertem
          </button>
        )}
        <div className="flex flex-wrap gap-2">
          <a href={pdfHref} target="_blank" rel="noopener" className="btn btn-secondary min-h-10 px-3 text-sm" onClick={onPdf}>
            <Download className="h-4 w-4" aria-hidden="true" /> Pobierz plan (PDF)
          </a>
          <button type="button" className="btn btn-ghost min-h-10 text-sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" aria-hidden="true" /> Drukuj
          </button>
          <button type="button" className="btn btn-ghost min-h-10 text-sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Uwzględnij nowe odpowiedzi
          </button>
        </div>
        <p className="flex items-start gap-2 text-xs text-muted">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Plan zapisuje się tylko na tym urządzeniu. To informacja ogólna na podstawie Twoich odpowiedzi, a nie ocena prawna sprawy.
        </p>
      </div>
    </div>
  );
}
