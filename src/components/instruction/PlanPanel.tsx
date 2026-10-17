"use client";

import { CalendarDays, Check, Download, MessageCircle, Pencil, Phone } from "lucide-react";
import { CopyLink } from "@/components/ui/CopyLink";
import { EXPERT_VALUE, formatPlDate, type Plan, type PlanItem } from "@/lib/plan";

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

function Task({ it, on, toggle }: { it: PlanItem; on: boolean; toggle: () => void }) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-md border-2 bg-white px-4 py-3 ${on ? "border-navy" : it.urgent ? "border-urgent/40" : "border-line"}`}>
      <input type="checkbox" checked={on} onChange={toggle} className="mt-1 h-5 w-5 shrink-0 accent-navy" />
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
  );
}

/**
 * Treść „Planu …”: cel → gdzie jesteś → koszt zwlekania → pierwsze ruchy → etapy z datami → czego unikać
 * → na końcu wybór, jak działać dalej (samodzielnie / z bezpłatną pomocą / z ekspertem).
 */
export function PlanPanel({ plan, pdfHref, isDone, toggle, onEdit, onDiscuss, onPdf }: Props) {
  const all = plan.sections.flatMap((s) => s.items);
  const byId = new Map(all.map((i) => [i.id, i]));
  const doneCount = all.filter((i) => isDone(i.id)).length;
  const pct = all.length ? Math.round((doneCount / all.length) * 100) : 0;
  const quick = plan.quickWinIds.map((id) => byId.get(id)).filter((i): i is PlanItem => Boolean(i));

  return (
    <div>
      {/* cel */}
      <div className="border-b border-line px-5 py-6 sm:px-7">
        <p className="eyebrow">Twój plan · {plan.instructionTitle}</p>
        <h3 className="mt-1 text-2xl font-extrabold sm:text-3xl" data-autofocus tabIndex={-1}>
          {plan.heading}
        </h3>
        <div className="mt-4 rounded-md bg-navy px-4 py-4 text-white sm:px-5">
          <p className="text-xs font-extrabold uppercase tracking-wider text-white/70">Twój cel</p>
          <p className="mt-1 text-lg font-extrabold leading-snug">{plan.goal}</p>
          <p className="mt-2 text-sm text-white/80">
            Droga: {plan.pathName} · {all.length} zadań · do {formatPlDate(plan.endDate)}
          </p>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <span className="inline-flex items-center gap-1 text-muted">
            <CalendarDays className="h-4 w-4" aria-hidden="true" /> {formatPlDate(plan.startDate)} – {formatPlDate(plan.endDate)}
          </span>
          {plan.deadline && (
            <span className={`rounded-sm px-2.5 py-1 font-bold ${plan.deadline.daysLeft <= 7 ? "bg-urgent-soft text-urgent" : "bg-gold-soft"}`}>
              Termin: {formatPlDate(plan.deadline.date)} ({dayLabel(plan.deadline.daysLeft)})
            </span>
          )}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
            <div className="h-full bg-navy transition-[width]" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-semibold tabular-nums text-muted" aria-live="polite">
            {doneCount} z {all.length} zrobione
          </span>
        </div>
      </div>

      {/* gdzie jesteś / co zyskasz */}
      <div className="grid gap-5 border-b border-line bg-canvas px-5 py-6 sm:grid-cols-2 sm:px-7">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-muted">Gdzie jesteś teraz</p>
          <ul className="list-dash mt-2 text-sm">
            {plan.now.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        <div>
          {plan.gains.length > 0 && (
            <>
              <p className="text-xs font-extrabold uppercase tracking-wider text-muted">Co jeszcze zyskasz</p>
              <ul className="list-dash mt-2 mb-3 text-sm">
                {plan.gains.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </>
          )}
          <p className="text-sm">
            <span className="font-bold">Dlaczego ta droga: </span>
            {plan.reason}
          </p>
        </div>
        {plan.costOfWaiting.length > 0 && (
          <div className="rounded-md border-l-4 border-urgent bg-white px-4 py-3 sm:col-span-2">
            <p className="text-xs font-extrabold uppercase tracking-wider text-urgent">Ile kosztuje zwlekanie</p>
            <ul className="list-dash mt-2 text-sm">
              {plan.costOfWaiting.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="grid gap-9 px-5 py-7 sm:px-7">
        {/* pierwsze ruchy */}
        {quick.length > 0 && (
          <section aria-label="Zacznij od tego">
            <h4 className="text-xl font-extrabold">Zacznij od tego – {quick.length === 1 ? "jeden ruch" : `${quick.length} ruchy`} na dziś</h4>
            <p className="mt-1 text-sm text-muted">Najmniejsze kroki, które od razu poprawiają Twoją sytuację.</p>
            <ul className="mt-3 grid gap-2">
              {quick.map((it) => (
                <li key={it.id}>
                  <Task it={it} on={isDone(it.id)} toggle={() => toggle(it.id)} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {onDiscuss && (
          <div className="flex flex-col gap-3 rounded-md border-2 border-navy px-4 py-4 sm:flex-row sm:items-center">
            <p className="flex-1 text-sm">
              <span className="font-extrabold">Wolisz mieć pewność, że to dobra kolejność?</span> Ekspert bezpłatnie przejrzy ten plan razem z Tobą.
            </p>
            <button type="button" className="btn btn-secondary min-h-10 shrink-0 px-3 text-sm" onClick={onDiscuss}>
              Omów plan
            </button>
          </div>
        )}

        {/* etapy */}
        {plan.sections.map((s) => (
          <section key={s.id} aria-label={s.title}>
            {s.kicker && <p className={`text-xs font-extrabold uppercase tracking-wider ${s.id === "pilne" ? "text-urgent" : "text-muted"}`}>{s.kicker}</p>}
            <h4 className="text-lg font-extrabold">{s.title}</h4>
            {s.why && <p className="mt-0.5 text-sm text-muted">{s.why}</p>}
            <ul className="mt-3 grid gap-2">
              {s.items.map((it) => (
                <li key={it.id}>
                  <Task it={it} on={isDone(it.id)} toggle={() => toggle(it.id)} />
                </li>
              ))}
            </ul>
          </section>
        ))}

        {/* co dalej – zawsze na końcu */}
        <section aria-labelledby="plan-dalej" className="border-t-2 border-navy pt-7">
          <h4 id="plan-dalej" className="text-2xl font-extrabold">
            Jak chcesz działać dalej?
          </h4>
          <p className="mt-1 text-sm text-muted">Plan jest Twój bez względu na wybór. Każda z tych dróg jest w porządku.</p>
          <div className={`mt-5 grid gap-3 ${onDiscuss ? "lg:grid-cols-3" : "sm:grid-cols-2"}`}>
            <div className="card flex flex-col p-4">
              <p className="font-extrabold">Samodzielnie</p>
              <p className="mt-1 flex-1 text-sm text-muted">Masz wszystko w tym planie. Pobierz go jako PDF i odhaczaj zadania – postęp zapamiętamy na tym urządzeniu.</p>
              <a href={pdfHref} target="_blank" rel="noopener" className="btn btn-secondary mt-3 min-h-10 px-3 text-sm" onClick={onPdf}>
                <Download className="h-4 w-4" aria-hidden="true" /> Pobierz plan (PDF)
              </a>
            </div>
            <div className="card flex flex-col p-4">
              <p className="font-extrabold">Z bezpłatną pomocą</p>
              <p className="mt-1 text-sm text-muted">Weź ten plan na spotkanie – łatwiej opiszesz sprawę.</p>
              <ul className="mt-2 grid flex-1 gap-2 text-sm">
                {plan.freeHelp.slice(0, 3).map((h) => (
                  <li key={h.name}>
                    <span className="block font-semibold">{h.name}</span>
                    {h.phone && (
                      <a href={`tel:${h.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" aria-hidden="true" /> {h.phone}
                      </a>
                    )}
                    {h.url && <CopyLink url={h.url} label={new URL(h.url).hostname.replace(/^www\./, "")} className="text-muted" />}
                  </li>
                ))}
              </ul>
            </div>
            {onDiscuss && (
              <div className="flex flex-col rounded-md border-2 border-navy bg-white p-4">
                <p className="flex items-center justify-between gap-2 font-extrabold">
                  Z ekspertem <span className="badge border-gold text-navy">bezpłatnie</span>
                </p>
                <ul className="mt-2 grid flex-1 gap-1.5 text-sm">
                  {EXPERT_VALUE.map((t) => (
                    <li key={t} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                      {t}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-muted">Pierwsza rozmowa jest bezpłatna i do niczego nie zobowiązuje.</p>
                <button type="button" className="btn btn-primary mt-3 min-h-10 px-3 text-sm" onClick={onDiscuss}>
                  <MessageCircle className="h-4 w-4" aria-hidden="true" /> Omów plan z ekspertem
                </button>
              </div>
            )}
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-5">
          <p className="mr-auto text-xs font-extrabold uppercase tracking-wider text-muted">Koniec planu</p>
          <button type="button" className="btn btn-ghost min-h-10 text-sm" onClick={onEdit}>
            <Pencil className="h-4 w-4" aria-hidden="true" /> Zmień odpowiedzi
          </button>
          <a href={pdfHref} target="_blank" rel="noopener" className="btn btn-ghost min-h-10 text-sm" onClick={onPdf}>
            <Download className="h-4 w-4" aria-hidden="true" /> PDF
          </a>
        </div>
        <p className="-mt-6 text-xs text-muted">
          Plan zapisuje się tylko na tym urządzeniu. Daty są propozycją na podstawie Twoich odpowiedzi; to informacja ogólna, a nie ocena prawna sprawy.
        </p>
      </div>
    </div>
  );
}
