"use client";

import { CalendarDays, Check, Download, MessageCircle, Pencil, Printer } from "lucide-react";
import { formatPlDate, MODE_LABEL, type Plan } from "@/lib/plan";

interface Props {
  plan: Plan;
  pdfHref: string;
  isDone: (id: string) => boolean;
  toggle: (id: string) => void;
  /** wraca do pytań kreatora */
  onEdit: () => void;
  /** brak = w tej instrukcji nie ma kontaktu z ekspertem */
  onDiscuss?: () => void;
  onPdf?: () => void;
}

const dayLabel = (n: number) => (n === 0 ? "dziś" : n === 1 ? "jutro" : n < 0 ? `${-n} dni temu` : `za ${n} dni`);

/** „Plan …” – osobisty plan z podsumowaniem, rekomendowaną drogą i harmonogramem; odhaczenia wspólne z sekcjami C i D. */
export function PlanPanel({ plan, pdfHref, isDone, toggle, onEdit, onDiscuss, onPdf }: Props) {
  const all = plan.sections.flatMap((s) => s.items);
  const doneCount = all.filter((i) => isDone(i.id)).length;
  const pct = all.length ? Math.round((doneCount / all.length) * 100) : 0;
  const nextTask = all.find((i) => !isDone(i.id) && i.due && i.id !== "termin");

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-line px-5 py-5 sm:px-7">
        <p className="eyebrow">Twój plan · {plan.instructionTitle}</p>
        <h3 className="mt-1 text-2xl font-extrabold sm:text-3xl">{plan.heading}</h3>
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          <span>Droga: <span className="font-semibold text-navy">{plan.pathName}</span></span>
          <span>{MODE_LABEL[plan.mode]}</span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" /> {formatPlDate(plan.startDate)} – {formatPlDate(plan.endDate)}
          </span>
        </p>
        {plan.deadline && (
          <p className={`mt-3 inline-flex rounded-sm px-3 py-1.5 text-sm font-bold ${plan.deadline.daysLeft <= 7 ? "bg-urgent-soft text-urgent" : "bg-gold-soft"}`}>
            Termin: {formatPlDate(plan.deadline.date)} ({dayLabel(plan.deadline.daysLeft)})
          </p>
        )}
        <div className="mt-4 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
            <div className="h-full bg-navy transition-[width]" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-semibold tabular-nums text-muted" aria-live="polite">
            {doneCount} z {all.length} zrobione
          </span>
        </div>
      </div>

      <div className="grid gap-4 border-b border-line bg-canvas px-5 py-5 sm:grid-cols-2 sm:px-7">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-muted">Twoja sytuacja w skrócie</p>
          <ul className="list-dash mt-2 text-sm">
            {plan.summary.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-muted">Dlaczego ta droga</p>
          <p className="mt-2 text-sm">{plan.reason}</p>
          {nextTask && (
            <p className="mt-3 rounded-md border-2 border-navy bg-white px-3 py-2 text-sm">
              <span className="font-extrabold">Następny krok ({formatPlDate(nextTask.due!)}):</span> {nextTask.label}
            </p>
          )}
        </div>
      </div>

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
                      <span className="min-w-0 flex-1">
                        <span className={`block font-semibold ${on ? "line-through decoration-gold decoration-2" : ""}`}>{it.label}</span>
                        {it.detail && <span className="mt-0.5 block text-sm text-muted">{it.detail}</span>}
                      </span>
                      {it.due && (
                        <span className={`shrink-0 rounded-sm px-2 py-0.5 text-xs font-bold tabular-nums ${it.urgent && !on ? "bg-urgent-soft text-urgent" : "bg-canvas text-muted"}`}>
                          {formatPlDate(it.due).slice(0, 5)}
                        </span>
                      )}
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
          <button type="button" className="btn btn-ghost min-h-10 text-sm" onClick={onEdit}>
            <Pencil className="h-4 w-4" aria-hidden="true" /> Zmień odpowiedzi
          </button>
        </div>
        <p className="flex items-start gap-2 text-xs text-muted">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Plan zapisuje się tylko na tym urządzeniu. Daty są propozycją na podstawie Twoich odpowiedzi; to informacja ogólna, a nie ocena prawna sprawy.
        </p>
      </div>
    </div>
  );
}
