"use client";

import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { resolve } from "@/lib/decision-engine";
import { todayIso, type PlanDeadlineStatus, type PlanInput, type PlanStart } from "@/lib/plan";
import { PATH_KIND_LABEL, type Instruction } from "@/lib/types";

export type PlanConfig = Omit<PlanInput, "d">;

interface Props {
  ins: Instruction;
  initial: PlanConfig;
  /** dokumenty, które już są (wspólne z sekcją D) */
  initialDocs: string[];
  onCancel: () => void;
  onDone: (cfg: PlanConfig, docs: string[]) => void;
}

type StepKey = "sytuacja" | "sprawa" | "droga" | "dokumenty" | "termin";
const STEP_TITLE: Record<StepKey, string> = { sytuacja: "Twoja sytuacja", sprawa: "Twoja sprawa", droga: "Droga", dokumenty: "Dokumenty", termin: "Termin" };

function Choice({ name, value, current, onChange, label, hint }: { name: string; value: string; current: string | undefined; onChange: (v: string) => void; label: string; hint?: string }) {
  const on = current === value;
  return (
    <label className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-md border-2 bg-white px-4 py-3 ${on ? "border-navy" : "border-line hover:border-navy"}`}>
      <input type="radio" name={name} value={value} checked={on} onChange={() => onChange(value)} className="mt-1 h-4 w-4 shrink-0 accent-navy" />
      <span>
        <span className="block font-semibold">{label}</span>
        {hint && <span className="block text-sm text-muted">{hint}</span>}
      </span>
    </label>
  );
}

/**
 * Kreator „Planu …”: kilka pytań, po których plan jest dopasowany do sytuacji –
 * sytuacja, drzewo decyzji, droga, posiadane dokumenty, termin w sprawie i start.
 */
export function PlanWizard({ ins, initial, initialDocs, onCancel, onDone }: Props) {
  const ids = useId();
  const [step, setStep] = useState(0);
  const [cfg, setCfg] = useState<PlanConfig>(initial);
  // nie pytamy drugi raz o to, na co odpowiedź już padła na stronie (sekcja A, drzewo decyzji)
  const [pendingQs] = useState(() => ins.situationQuestions.filter((q) => initial.s[q.id] === undefined));
  const [STEPS] = useState<StepKey[]>(() => [
    ...(pendingQs.length ? (["sytuacja"] as const) : []),
    ...(resolve(ins.decisionTree, initial.o).complete ? [] : (["sprawa"] as const)),
    "droga",
    "dokumenty",
    "termin",
  ]);
  const cur = STEPS[step];
  const [docs, setDocs] = useState<string[]>(initialDocs);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const tree = useMemo(() => resolve(ins.decisionTree, cfg.o), [ins.decisionTree, cfg.o]);
  const suggested = useMemo(() => [...new Set(tree.complete ? tree.outcomes.flatMap((o) => o.pathIds) : [])], [tree]);
  const path = ins.paths.find((p) => p.id === cfg.p) ?? ins.paths[0];

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: step === 0 });
  }, [step]);

  // po ukończeniu drzewa proponujemy drogę z wyniku (gdy wybrana do niego nie pasuje)
  useEffect(() => {
    if (suggested.length && !suggested.includes(cfg.p))
      // eslint-disable-next-line react-hooks/set-state-in-effect -- podpowiedź drogi po zmianie odpowiedzi
      setCfg((c) => ({ ...c, p: suggested[0] }));
  }, [suggested, cfg.p]);

  const set = (patch: Partial<PlanConfig>) => setCfg((c) => ({ ...c, ...patch }));
  const last = step === STEPS.length - 1;
  const next = () => (last ? onDone({ ...cfg, g: todayIso() }, docs) : setStep((s) => s + 1));

  return (
    <div className="flex min-h-full flex-col">
      <div className="border-b border-line px-5 py-5 sm:px-7">
        <p className="eyebrow">Krok {step + 1} z {STEPS.length}</p>
        <h3 ref={headingRef} tabIndex={-1} data-autofocus className="mt-1 text-2xl font-extrabold outline-none">
          {STEP_TITLE[cur]}
        </h3>
        <div className="mt-4 flex items-center gap-3" aria-hidden="true">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
            <div className="h-full bg-navy transition-[width]" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
          <span className="text-xs font-semibold tabular-nums text-muted">
            {step + 1} / {STEPS.length}
          </span>
        </div>
        <p className="sr-only">
          Krok {step + 1} z {STEPS.length}
        </p>
      </div>

      <div className="flex-1 px-5 py-6 sm:px-7">
        {cur === "sytuacja" && (
          <div className="grid gap-3">
            <p className="text-sm text-muted">Zaznacz, co pasuje do Ciebie. Na tej podstawie ustawimy kolejność zadań.</p>
            {pendingQs.map((q) => (
              <fieldset key={q.id} className="rounded-md border border-line bg-white p-4">
                <legend className="sr-only">{q.question}</legend>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-semibold" aria-hidden="true">
                    {q.question}
                  </p>
                  <div className="flex shrink-0 gap-2">
                    {([1, 0] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        aria-pressed={cfg.s[q.id] === v}
                        onClick={() => set({ s: { ...cfg.s, [q.id]: v } })}
                        className={`min-h-11 min-w-16 rounded-sm border-2 px-4 font-bold ${cfg.s[q.id] === v ? "border-navy bg-navy text-white" : "border-line bg-white hover:border-navy"}`}
                      >
                        {v ? "Tak" : "Nie"}
                      </button>
                    ))}
                  </div>
                </div>
              </fieldset>
            ))}
          </div>
        )}

        {cur === "sprawa" && (
          <div>
            {!tree.complete && tree.node ? (
              <fieldset>
                <legend className="text-lg font-extrabold">{tree.node.question}</legend>
                {tree.node.help && <p className="mt-1 text-sm text-muted">{tree.node.help}</p>}
                <ul className="mt-4 grid gap-2">
                  {tree.node.options.map((o) => (
                    <li key={o.id}>
                      <button
                        type="button"
                        onClick={() => set({ o: [...tree.answers.map((a) => a.optionId), o.id] })}
                        className="flex min-h-12 w-full items-center justify-between gap-3 rounded-md border-2 border-line bg-white px-4 py-3 text-left font-semibold hover:border-navy"
                      >
                        {o.label} <span aria-hidden="true" className="text-muted">→</span>
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-muted">
                  Pytanie {tree.progress.answered + 1} z {tree.progress.total}
                </p>
              </fieldset>
            ) : (
              <div>
                <p className="font-extrabold">Na podstawie odpowiedzi:</p>
                <ul className="mt-3 grid gap-2">
                  {tree.outcomes.map((o) => (
                    <li key={o.id} className={`rounded-md border p-3 text-sm ${o.urgent ? "border-urgent bg-urgent-soft" : "border-line bg-white"}`}>
                      <span className="font-bold">
                        {o.urgent && "Pilne: "}
                        {o.title}
                      </span>
                      <span className="mt-0.5 block text-muted">{o.description}</span>
                    </li>
                  ))}
                </ul>
                {tree.uncertain && <p className="mt-3 text-sm font-semibold">Część odpowiedzi to „nie wiem” – plan uwzględni to jako sprawy do ustalenia.</p>}
              </div>
            )}
            {cfg.o.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className="btn btn-ghost min-h-10 text-sm" onClick={() => set({ o: cfg.o.slice(0, -1) })}>
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Cofnij odpowiedź
                </button>
                <button type="button" className="btn btn-ghost min-h-10 text-sm" onClick={() => set({ o: [] })}>
                  <RotateCcw className="h-4 w-4" aria-hidden="true" /> Od nowa
                </button>
              </div>
            )}
          </div>
        )}

        {cur === "droga" && (
          <div className="grid gap-2" role="radiogroup" aria-label="Droga w planie">
            <p className="mb-1 text-sm text-muted">{suggested.length ? "Zaznaczyliśmy drogę, która najlepiej pasuje do odpowiedzi. Możesz wybrać inną." : "Wybierz drogę, którą chcesz zaplanować."}</p>
            {ins.paths.map((p) => (
              <Choice
                key={p.id}
                name={`${ids}-droga`}
                value={p.id}
                current={cfg.p}
                onChange={(v) => set({ p: v })}
                label={`${p.name}${suggested.includes(p.id) ? " · pasuje do odpowiedzi" : ""}`}
                hint={`${PATH_KIND_LABEL[p.kind]} · ${p.summary}`}
              />
            ))}
          </div>
        )}

        {cur === "dokumenty" && (
          <div>
            <p className="text-sm text-muted">Droga: {path.name}. Zaznacz dokumenty, które już masz – w planie zostaną tylko brakujące.</p>
            {path.documents.length === 0 ? (
              <p className="mt-4">Ta droga nie wymaga szczególnych dokumentów.</p>
            ) : (
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {path.documents.map((d) => {
                  const on = docs.includes(d.id);
                  return (
                    <li key={d.id}>
                      <label className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-md border-2 bg-white px-4 py-3 ${on ? "border-navy" : "border-line"}`}>
                        <input type="checkbox" checked={on} onChange={() => setDocs((l) => (on ? l.filter((x) => x !== d.id) : [...l, d.id]))} className="mt-0.5 h-5 w-5 shrink-0 accent-navy" />
                        <span>{d.label}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {cur === "termin" && (
          <div className="grid gap-6">
            <fieldset className="grid gap-2">
              <legend className="mb-1 font-extrabold">Czy w Twojej sprawie biegnie jakiś termin?</legend>
              <p className="mb-2 text-sm text-muted">
                Termin to ostatni dzień, w którym trzeba coś zrobić – złożyć pismo, odpowiedzieć albo podjąć decyzję. Po nim tracisz możliwość działania albo
                sprawa toczy się bez Ciebie. Przykłady: 14 dni na sprzeciw od nakazu zapłaty, tydzień na skargę na czynność komornika, 6 miesięcy na decyzję
                o spadku. Termin znajdziesz zwykle w pouczeniu na końcu pisma.
              </p>
              {(
                [
                  ["yes", "Tak, znam datę", "Ułożymy pilne zadania przed tym dniem."],
                  ["unknown", "Nie wiem", "Dodamy jako pierwsze zadanie: ustal, czy i do kiedy biegnie termin."],
                  ["no", "Nie, nic mnie nie goni", "Plan rozłożymy spokojnie – zadanie co kilka dni."],
                ] as [PlanDeadlineStatus, string, string][]
              ).map(([v, l, h]) => (
                <Choice
                  key={v}
                  name={`${ids}-termin-status`}
                  value={v}
                  current={cfg.ds ?? (cfg.dl ? "yes" : undefined)}
                  onChange={(x) => set({ ds: x as PlanDeadlineStatus, dl: x === "yes" ? cfg.dl : undefined })}
                  label={l}
                  hint={h}
                />
              ))}
            </fieldset>
            {(cfg.ds === "yes" || (!cfg.ds && cfg.dl)) && (
              <div>
                <label htmlFor={`${ids}-termin`} className="field-label">
                  Ostatni dzień terminu
                </label>
                <input id={`${ids}-termin`} type="date" min={todayIso()} value={cfg.dl ?? ""} onChange={(e) => set({ dl: e.target.value || undefined })} className="field-input sm:max-w-xs" aria-describedby={`${ids}-termin-h`} />
                <p id={`${ids}-termin-h`} className="mt-1 text-xs text-muted">
                  Jak policzyć: od dnia odebrania pisma dodaj liczbę dni z pouczenia (np. odebrane 3.11 + 14 dni = 17.11). Gdy ostatni dzień wypada w sobotę lub
                  święto, zwykle przesuwa się na najbliższy dzień roboczy – w razie wątpliwości wpisz wcześniejszą datę.
                </p>
              </div>
            )}
            <fieldset className="grid gap-2">
              <legend className="mb-2 font-extrabold">Kiedy zaczynasz?</legend>
              {(
                [
                  ["now", "Dzisiaj"],
                  ["week", "W ciągu kilku dni"],
                  ["next", "Od przyszłego tygodnia"],
                ] as [PlanStart, string][]
              ).map(([v, l]) => (
                <Choice key={v} name={`${ids}-start`} value={v} current={cfg.t ?? "now"} onChange={(x) => set({ t: x as PlanStart })} label={l} />
              ))}
            </fieldset>
            <div className="sm:max-w-sm">
              <label htmlFor={`${ids}-imie`} className="field-label">
                Imię na planie <span className="font-normal text-muted">(opcjonalnie)</span>
              </label>
              <input id={`${ids}-imie`} value={cfg.n ?? ""} maxLength={40} onChange={(e) => set({ n: e.target.value.replace(/[^\p{L} '-]/gu, "") || undefined })} autoComplete="given-name" className="field-input" />
              <p className="mt-1 text-xs text-muted">Zostaje tylko na tym urządzeniu i w Twoim PDF.</p>
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t border-line bg-canvas px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-7">
        <button type="button" className="btn btn-ghost min-h-10 text-sm" onClick={() => (step === 0 ? onCancel() : setStep((s) => s - 1))}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {step === 0 ? "Anuluj" : "Wstecz"}
        </button>
        <button type="button" className="btn btn-primary ml-auto" onClick={next}>
          {last ? "Utwórz mój plan" : "Dalej"} <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
        {cur === "sprawa" && !tree.complete && <p className="w-full text-xs text-muted">Możesz pominąć pytania – plan będzie wtedy mniej dokładny.</p>}
      </div>
    </div>
  );
}
