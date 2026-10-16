"use client";

import { Check, Download, Printer } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Illustration } from "@/components/ui/Illustration";
import { StepNumber } from "@/components/ui/StepNumber";
import { store, track } from "@/lib/analytics-client";
import { PATH_KIND_LABEL, type Instruction, type Path } from "@/lib/types";
import { DecisionTree } from "./DecisionTree";
import { LeadForm } from "./LeadForm";
import { SectionHeading } from "./SectionHeading";

export interface LeadProps {
  topic: string;
  partnerName: string;
  disclosure: string;
  askEmail: boolean;
}

interface Props {
  instruction: Instruction;
  approved: Record<string, { id: string; alt: string }>;
  lead: LeadProps | null;
  instructionTitles: Record<string, string>;
  sourceNumbers: Record<string, number>;
  warningsSlot: ReactNode;
  freeHelpSlot: ReactNode;
}

const stepKey = (instructionId: string, stepId: string) => `step:${instructionId}:${stepId}`;

function SourceRefs({ ids, numbers }: { ids?: string[]; numbers: Record<string, number> }) {
  const valid = (ids ?? []).filter((id) => numbers[id]);
  if (!valid.length) return null;
  return (
    <span className="ml-1 whitespace-nowrap text-xs font-semibold text-muted">
      {valid.map((id) => (
        <a key={id} href={`#zrodlo-${id}`} className="ml-0.5 no-underline hover:underline" aria-label={`Źródło ${numbers[id]}`}>
          [{numbers[id]}]
        </a>
      ))}
    </span>
  );
}

function Facts({ title, items, tone = "plain" }: { title: string; items: string[]; tone?: "plain" | "risk" }) {
  if (!items.length) return null;
  return (
    <div>
      <p className={`text-sm font-extrabold ${tone === "risk" ? "text-urgent" : ""}`}>{title}</p>
      <ul className="list-dash mt-2 text-sm">
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

export function InstructionExplorer({ instruction: ins, approved, lead, instructionTitles, sourceNumbers, warningsSlot, freeHelpSlot }: Props) {
  const [selected, setSelected] = useState<string>(ins.paths[0].id);
  const [highlighted, setHighlighted] = useState<string[]>([]);
  const [done, setDone] = useState<string[]>([]);
  const [checked, setChecked] = useState<string[]>([]);
  const [expertOpen, setExpertOpen] = useState(false);
  const path = ins.paths.find((p) => p.id === selected) ?? ins.paths[0];
  const pathNames = useMemo(() => Object.fromEntries(ins.paths.map((p) => [p.id, p.name])), [ins.paths]);
  const storeKey = `ip:${ins.slug}`;

  useEffect(() => {
    const fromHash = window.location.hash.match(/^#droga-([a-z0-9-]+)/)?.[1];
    const saved = store.get<{ path?: string; done?: string[]; checked?: string[] }>(storeKey, {});
    const initial = [fromHash, saved.path].find((p) => p && ins.paths.some((x) => x.id === p));
    /* eslint-disable react-hooks/set-state-in-effect -- przywrócenie postępu z localStorage po hydratacji */
    if (initial) setSelected(initial);
    setDone(saved.done ?? []);
    setChecked(saved.checked ?? []);
    /* eslint-enable react-hooks/set-state-in-effect */
    track("instruction_opened", { instructionSlug: ins.slug });
    store.set("ip:last", { slug: ins.slug, title: ins.title, at: Date.now() });
  }, [ins.slug, ins.title, ins.paths, storeKey]);

  const persist = (patch: { path?: string; done?: string[]; checked?: string[] }) => {
    const cur = store.get<Record<string, unknown>>(storeKey, {});
    store.set(storeKey, { ...cur, ...patch });
  };

  const selectPath = useCallback(
    (id: string, scroll = true) => {
      setSelected(id);
      persist({ path: id });
      track("path_selected", { instructionSlug: ins.slug, pathId: id });
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#droga-${id}`);
      if (scroll) document.getElementById("kroki")?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ins.slug],
  );

  const onResult = useCallback((ids: string[]) => setHighlighted(ids), []);

  const toggleStep = (stepId: string) => {
    const next = done.includes(stepId) ? done.filter((s) => s !== stepId) : [...done, stepId];
    setDone(next);
    persist({ done: next });
    if (!done.includes(stepId)) track("instruction_step_completed", { instructionSlug: ins.slug, pathId: path.id, props: { step: stepId } });
  };

  const toggleCheck = (id: string) => {
    const next = checked.includes(id) ? checked.filter((s) => s !== id) : [...checked, id];
    setChecked(next);
    persist({ checked: next });
    if (!checked.includes(id)) track("instruction_step_completed", { instructionSlug: ins.slug, pathId: path.id, props: { checklist_item: id } });
  };

  const openExpert = (source: string) => {
    setExpertOpen(true);
    track("expert_cta_clicked", { instructionSlug: ins.slug, pathId: path.id, props: { source } });
    requestAnimationFrame(() => document.getElementById("pomoc-formularz")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const doneInPath = path.steps.filter((s) => done.includes(s.id)).length;
  const checkedInPath = path.documents.filter((d) => checked.includes(d.id));
  const pdfChecklistHref = `/instrukcje/${ins.slug}/pdf?lista=${path.id}${checkedInPath.length ? `&zaznaczone=${checkedInPath.map((d) => d.id).join(",")}` : ""}`;
  const showExpertChoice = Boolean(lead && path.expertHelpAvailable);

  return (
    <>
      {/* B — drogi */}
      <section aria-labelledby="sekcja-b" className="border-t border-line py-12 sm:py-16">
        <SectionHeading letter="B" id="sekcja-b" title="Poznaj możliwe drogi" lead="Odpowiedz na kilka pytań albo od razu przejrzyj wszystkie drogi. Każda ma swoje warunki, koszty i ryzyko." />
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <DecisionTree
              tree={ins.decisionTree}
              instructionSlug={ins.slug}
              pathNames={pathNames}
              instructionTitles={instructionTitles}
              onSelectPath={(id) => selectPath(id)}
              onResult={onResult}
            />
          </div>
          <PathMap paths={ins.paths} highlighted={highlighted} selected={selected} onSelect={selectPath} sourceNumbers={sourceNumbers} />
        </div>
      </section>

      {/* C — kroki */}
      <section id="kroki" aria-labelledby="sekcja-c" className="border-t border-line py-12 sm:py-16">
        <SectionHeading letter="C" id="sekcja-c" title="Instrukcja krok po kroku" lead="Wybierz drogę. Odhaczaj kroki – zapamiętamy postęp na tym urządzeniu." />
        <div className="no-print mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label htmlFor="wybor-drogi" className="text-sm font-bold">
            Droga:
          </label>
          <select id="wybor-drogi" className="field-input sm:max-w-md" value={path.id} onChange={(e) => selectPath(e.target.value, false)}>
            {ins.paths.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <p className="text-sm text-muted sm:ml-auto" aria-live="polite">
            Zrobione: {doneInPath} z {path.steps.length}
          </p>
        </div>

        <div id={`droga-${path.id}`} className="mt-8">
          <p className="eyebrow">{PATH_KIND_LABEL[path.kind]}</p>
          <h3 className="mt-1 text-2xl font-extrabold sm:text-3xl">{path.name}</h3>
          <p className="mt-2 max-w-2xl text-muted">{path.summary}</p>
          <ol className="mt-8 grid gap-px overflow-hidden rounded-md border border-line bg-line">
            {path.steps.map((s) => {
              const isDone = done.includes(s.id);
              const appr = approved[stepKey(ins.id, s.id)];
              return (
                <li key={s.id} className="grid gap-6 bg-white p-5 sm:grid-cols-[88px_1fr_220px] sm:gap-8 sm:p-8">
                  <div className="flex items-end justify-between gap-4 sm:block">
                    <StepNumber n={s.number} />
                    <div className="w-32 sm:hidden">
                      <Illustration id={s.illustration} approved={appr} alt={s.illustrationAlt} />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xl font-extrabold leading-snug sm:text-2xl">{s.title}</h4>
                    <p className="mt-3 text-base">
                      {s.explanation}
                      <SourceRefs ids={s.sourceReferences} numbers={sourceNumbers} />
                    </p>
                    {s.checklist && s.checklist.length > 0 && (
                      <ul className="list-dash mt-4 text-sm">
                        {s.checklist.map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                    )}
                    {s.warning && (
                      <p className="mt-4 border-l-4 border-urgent bg-urgent-soft px-4 py-3 text-sm">
                        <strong>Uwaga: </strong>
                        {s.warning}
                      </p>
                    )}
                    <button
                      type="button"
                      aria-pressed={isDone}
                      onClick={() => toggleStep(s.id)}
                      className={`no-print mt-5 inline-flex min-h-11 items-center gap-2 rounded-sm border-2 px-3 text-sm font-bold ${isDone ? "border-navy bg-navy text-white" : "border-line hover:border-navy"}`}
                    >
                      <Check className="h-4 w-4" aria-hidden="true" />
                      {isDone ? "Zrobione" : "Oznacz jako zrobione"}
                    </button>
                  </div>
                  <div className="hidden max-w-[220px] sm:block">
                    <Illustration id={s.illustration} approved={appr} alt={s.illustrationAlt} />
                  </div>
                </li>
              );
            })}
          </ol>

          {showExpertChoice && lead && (
            <div className="no-print mt-10">
              <p className="text-lg font-extrabold">Możesz zrobić to samodzielnie lub skorzystać z pomocy.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <a href="#dokumenty" className="card block p-5 no-underline hover:border-navy">
                  <span className="block font-extrabold">Samodzielnie</span>
                  <span className="mt-1 block text-sm text-muted">Przejdź do instrukcji i potrzebnych dokumentów.</span>
                </a>
                <button type="button" onClick={() => openExpert("path-choice")} className="card block p-5 text-left hover:border-navy">
                  <span className="block font-extrabold">Z ekspertem</span>
                  <span className="mt-1 block text-sm text-muted">Porozmawiaj bezpłatnie o swojej sytuacji i możliwych następnych krokach.</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* D — dokumenty */}
      <section id="dokumenty" aria-labelledby="sekcja-d" className="border-t border-line py-12 sm:py-16">
        <SectionHeading letter="D" id="sekcja-d" title="Co przygotować?" lead={`Lista dla drogi: ${path.name}. Odhaczaj to, co już masz.`} />
        {path.documents.length === 0 ? (
          <p className="mt-6 text-muted">Ta droga nie wymaga szczególnych dokumentów.</p>
        ) : (
          <ul className="mt-8 grid gap-2 sm:grid-cols-2">
            {path.documents.map((d) => {
              const on = checked.includes(d.id);
              return (
                <li key={d.id}>
                  <label className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-md border-2 bg-white px-4 py-3 ${on ? "border-navy" : "border-line"}`}>
                    <input type="checkbox" checked={on} onChange={() => toggleCheck(d.id)} className="mt-0.5 h-5 w-5 shrink-0 accent-navy" />
                    <span className={on ? "line-through decoration-gold decoration-2" : ""}>{d.label}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
        <div className="no-print mt-6 flex flex-wrap gap-3">
          <a href={pdfChecklistHref} className="btn btn-secondary" onClick={() => track("pdf_downloaded", { instructionSlug: ins.slug, pathId: path.id, props: { source: "checklist" } })}>
            <Download className="h-4 w-4" aria-hidden="true" /> Zapisz listę jako PDF
          </a>
          <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
            <Printer className="h-4 w-4" aria-hidden="true" /> Drukuj
          </button>
        </div>
      </section>

      {/* E — ostrzeżenia (treść z serwera) */}
      {warningsSlot}

      {/* F — pomoc */}
      <section id="pomoc" aria-labelledby="sekcja-f" className="border-t border-line py-12 sm:py-16">
        <SectionHeading letter="F" id="sekcja-f" title="Potrzebujesz pomocy?" />
        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <div>{freeHelpSlot}</div>
          {lead && (
            <div id="pomoc-formularz" className="card p-5 sm:p-7">
              <p className="text-xl font-extrabold">Nie musisz wszystkiego robić samodzielnie.</p>
              <p className="mt-2 text-muted">Możesz bezpłatnie porozmawiać z ekspertem i dowiedzieć się, jakie kolejne kroki warto rozważyć.</p>
              {!expertOpen ? (
                <button type="button" className="btn btn-secondary mt-5" onClick={() => openExpert("help-section")}>
                  Porozmawiaj bezpłatnie z ekspertem →
                </button>
              ) : (
                <div className="mt-6">
                  <LeadForm
                    topic={lead.topic}
                    partnerName={lead.partnerName}
                    disclosure={lead.disclosure}
                    askEmail={lead.askEmail}
                    instructionSlug={ins.slug}
                    instructionTitle={ins.title}
                    pathId={path.id}
                    pathName={path.name}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function PathMap({
  paths,
  highlighted,
  selected,
  onSelect,
  sourceNumbers,
}: {
  paths: Path[];
  highlighted: string[];
  selected: string;
  onSelect: (id: string) => void;
  sourceNumbers: Record<string, number>;
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="inline-flex min-h-11 items-center rounded-sm bg-navy px-4 font-bold text-white">Twoja sytuacja</span>
        <span className="text-sm text-muted">→ możliwe drogi ({paths.length})</span>
      </div>
      <ol className="relative mt-2 ml-5 border-l-2 border-navy pl-6">
        {paths.map((p, idx) => {
          const hl = highlighted.includes(p.id);
          return (
            <li key={p.id} className="relative pt-4">
              <span aria-hidden="true" className="absolute -left-6 top-10 h-0.5 w-6 bg-navy" />
              <div className={`card p-4 sm:p-5 ${hl ? "border-2 border-gold" : ""} ${selected === p.id ? "ring-2 ring-navy ring-offset-2" : ""}`}>
                <div className="flex gap-4">
                  <Illustration id={p.illustration} decorative className="hidden w-20 shrink-0 sm:block" />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-extrabold tabular-nums text-muted">{String(idx + 1).padStart(2, "0")}</span>
                      <span className="badge">{PATH_KIND_LABEL[p.kind]}</span>
                      {hl && <span className="badge border-gold text-navy">Pasuje do odpowiedzi</span>}
                    </p>
                    <h3 className="mt-2 text-lg font-extrabold leading-snug">{p.name}</h3>
                    <p className="mt-1 text-sm text-muted">
                      {p.summary}
                      <SourceRefs ids={p.sourceReferences} numbers={sourceNumbers} />
                    </p>
                  </div>
                </div>
                <details className="group mt-3">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center text-sm font-bold underline [&::-webkit-details-marker]:hidden">
                    <span className="group-open:hidden">Pokaż szczegóły</span>
                    <span className="hidden group-open:inline">Ukryj szczegóły</span>
                  </summary>
                  <div className="mt-3 grid gap-5 sm:grid-cols-2">
                    <Facts title="Dla kogo może mieć sens?" items={p.whenApplicable} />
                    <Facts title="Kiedy raczej się nie sprawdzi?" items={p.whenNotApplicable} />
                    <Facts title="Co można zyskać?" items={p.benefits} />
                    <Facts title="Ryzyka" items={p.risks} tone="risk" />
                    <Facts title="Koszty" items={p.costs} />
                    <Facts title="Warunki" items={p.requirements} />
                  </div>
                  <p className="mt-5 rounded-md bg-canvas px-4 py-3 text-sm">
                    <strong>Pierwszy krok: </strong>
                    {p.firstStep}
                  </p>
                </details>
                <button type="button" className="btn btn-secondary mt-3 min-h-10 w-full px-3 py-2 text-sm sm:w-auto" onClick={() => onSelect(p.id)}>
                  Instrukcja krok po kroku ({p.steps.length}) →
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
