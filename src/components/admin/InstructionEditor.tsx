"use client";

import { useState, useTransition } from "react";
import { publishInstructionAction, saveInstructionAction, unpublishInstructionAction, type ActionResult } from "@/app/admin/actions";
import { illustrationIds } from "@/illustrations/library";
import { PATH_KIND_LABEL, type Instruction, type Path, type PathKind, type Step } from "@/lib/types";

const CATEGORIES: [string, string][] = [
  ["dlugi-i-komornik", "Długi i komornik"],
  ["firma-w-trudnosciach", "Firma w trudnościach"],
  ["podatki-przedsiebiorcy", "Podatki przedsiębiorcy"],
  ["ochrona-marki", "Ochrona marki"],
  ["rozwod-i-rodzina", "Rozwód i rodzina"],
  ["kredyty-i-banki", "Kredyty i banki"],
  ["umowy-i-konsumenci", "Umowy i konsumenci"],
  ["inne-sprawy", "Inne sprawy"],
];

const lines = (v: string) =>
  v
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

function Text({ value, onChange, area = false, rows = 3 }: { value: string; onChange: (v: string) => void; area?: boolean; rows?: number }) {
  return area ? (
    <textarea className="field-input" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
  ) : (
    <input className="field-input" value={value} onChange={(e) => onChange(e.target.value)} />
  );
}

function Lines({ value, onChange, rows = 3 }: { value: string[]; onChange: (v: string[]) => void; rows?: number }) {
  const [raw, setRaw] = useState(value.join("\n"));
  return (
    <textarea
      className="field-input"
      rows={rows}
      value={raw}
      onChange={(e) => {
        setRaw(e.target.value);
        onChange(lines(e.target.value));
      }}
    />
  );
}

function IllustrationSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select className="field-input" value={value} onChange={(e) => onChange(e.target.value)}>
      {illustrationIds.map((id) => (
        <option key={id} value={id}>
          {id}
        </option>
      ))}
    </select>
  );
}

function JsonField<T>({ label, value, onChange, rows = 12 }: { label: string; value: T; onChange: (v: T) => void; rows?: number }) {
  const [raw, setRaw] = useState(JSON.stringify(value, null, 2));
  const [err, setErr] = useState("");
  return (
    <Field label={label}>
      <textarea
        className="field-input font-mono text-xs"
        rows={rows}
        value={raw}
        aria-invalid={Boolean(err)}
        onChange={(e) => {
          setRaw(e.target.value);
          try {
            onChange(JSON.parse(e.target.value));
            setErr("");
          } catch {
            setErr("Niepoprawny JSON – zmiana nie zostanie zapisana, dopóki go nie poprawisz.");
          }
        }}
      />
      {err && <span className="field-error block">{err}</span>}
    </Field>
  );
}

const TABS = ["Podstawowe", "A · Pytania", "B–D · Drogi i kroki", "E · Ostrzeżenia", "Zaawansowane"] as const;

export function InstructionEditor({ initial, status, hasPublished, leadTopics }: { initial: Instruction; status: string; hasPublished: boolean; leadTopics: string[] }) {
  const [doc, setDoc] = useState<Instruction>(initial);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Podstawowe");
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();
  const [openPath, setOpenPath] = useState<string | null>(initial.paths[0]?.id ?? null);

  const patch = (p: Partial<Instruction>) => setDoc((d) => ({ ...d, ...p }));
  const patchPath = (idx: number, p: Partial<Path>) => setDoc((d) => ({ ...d, paths: d.paths.map((x, i) => (i === idx ? { ...x, ...p } : x)) }));
  const patchStep = (pi: number, si: number, p: Partial<Step>) =>
    setDoc((d) => ({ ...d, paths: d.paths.map((x, i) => (i === pi ? { ...x, steps: x.steps.map((s, j) => (j === si ? { ...s, ...p } : s)) } : x)) }));
  const renumber = (steps: Step[], pathId: string) => steps.map((s, i) => ({ ...s, number: i + 1, id: s.id || `${pathId}-k${i + 1}` }));

  const run = (fn: () => Promise<ActionResult>) =>
    start(async () => {
      const r = await fn();
      setResult(r);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

  const save = (st: "draft" | "review") => run(() => saveInstructionAction(doc.id, JSON.stringify(doc), st));
  const publish = () =>
    run(async () => {
      const r = await saveInstructionAction(doc.id, JSON.stringify(doc), "review");
      if (!r.ok) return r;
      return publishInstructionAction(doc.id);
    });

  return (
    <div className="grid gap-6">
      {result && (
        <div role="status" className={`rounded-md border p-4 text-sm ${result.ok ? "border-navy bg-white" : "border-urgent bg-urgent-soft"}`}>
          {result.message && <p className="font-bold">{result.message}</p>}
          {result.errors && (
            <>
              <p className="font-bold">Nie zapisano – popraw błędy:</p>
              <ul className="list-dash mt-2">
                {result.errors.slice(0, 30).map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-secondary" disabled={pending} onClick={() => save("draft")}>
          Zapisz szkic
        </button>
        <button type="button" className="btn btn-secondary" disabled={pending} onClick={() => save("review")}>
          Wyślij do zatwierdzenia
        </button>
        <button type="button" className="btn btn-primary" disabled={pending} onClick={publish}>
          Zatwierdź i opublikuj
        </button>
        <a className="btn btn-ghost" href={`/admin/podglad/instrukcje/${doc.id}`} target="_blank" rel="noopener">
          Podgląd zapisanej wersji ↗
        </a>
        {hasPublished && (
          <button type="button" className="btn btn-ghost text-urgent" disabled={pending} onClick={() => run(() => unpublishInstructionAction(doc.id, false))}>
            Wycofaj publikację
          </button>
        )}
        {status !== "archived" && (
          <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => run(() => unpublishInstructionAction(doc.id, true))}>
            Archiwizuj
          </button>
        )}
      </div>
      <p className="text-xs text-muted">
        „Zatwierdź i opublikuj” zapisuje datę weryfikacji prawnej i Twoje imię jako recenzenta. Publikuj tylko po merytorycznym sprawdzeniu treści i źródeł.
      </p>

      <div role="tablist" className="flex flex-wrap gap-1 border-b border-line">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} type="button" onClick={() => setTab(t)} className={`px-3 py-2 text-sm font-bold ${tab === t ? "border-b-2 border-navy" : "text-muted"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Podstawowe" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tytuł (pytanie użytkownika)">
            <Text value={doc.title} onChange={(v) => patch({ title: v })} />
          </Field>
          <Field label="Slug (adres)" hint="małe litery, bez polskich znaków">
            <Text value={doc.slug} onChange={(v) => patch({ slug: v })} />
          </Field>
          <Field label="Podtytuł">
            <Text value={doc.subtitle} onChange={(v) => patch({ subtitle: v })} />
          </Field>
          <Field label="Kategoria">
            <select className="field-input" value={doc.category} onChange={(e) => patch({ category: e.target.value as Instruction["category"] })}>
              {CATEGORIES.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Krótki opis">
              <Text area value={doc.shortDescription} onChange={(v) => patch({ shortDescription: v })} />
            </Field>
          </div>
          <Field label="Czas czytania (min)">
            <input type="number" min={1} max={60} className="field-input" value={doc.estimatedReadingTime} onChange={(e) => patch({ estimatedReadingTime: Number(e.target.value) })} />
          </Field>
          <Field label="Ilustracja główna">
            <IllustrationSelect value={doc.illustration} onChange={(v) => patch({ illustration: v })} />
          </Field>
          <Field label="Data researchu (stan prawny)">
            <input type="date" className="field-input" value={doc.researchedAt} onChange={(e) => patch({ researchedAt: e.target.value })} />
          </Field>
          <Field label="Temat kontaktu z ekspertem" hint="Pusty = brak formularza w instrukcji">
            <select className="field-input" value={doc.leadTopic ?? ""} onChange={(e) => patch({ leadTopic: e.target.value || null })}>
              <option value="">— brak —</option>
              {leadTopics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={doc.aiAssisted} onChange={(e) => patch({ aiAssisted: e.target.checked })} className="h-5 w-5" /> Treść przygotowana z pomocą AI
          </label>
          <div className="sm:col-span-2 grid gap-4 rounded-md border border-line p-4">
            <p className="font-bold">Pilne (opcjonalne)</p>
            <Field label="Nagłówek">
              <Text value={doc.urgent?.title ?? ""} onChange={(v) => patch({ urgent: v ? { title: v, items: doc.urgent?.items ?? [] } : undefined })} />
            </Field>
            <Field label="Punkty (jeden w linii)">
              <Lines value={doc.urgent?.items ?? []} onChange={(v) => patch({ urgent: doc.urgent ? { ...doc.urgent, items: v } : undefined })} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Opis stanu prawnego">
              <Text area value={doc.legalStatusNote} onChange={(v) => patch({ legalStatusNote: v })} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Niepotwierdzone elementy (jeden w linii)">
              <Lines value={doc.pendingVerification} onChange={(v) => patch({ pendingVerification: v })} rows={4} />
            </Field>
          </div>
          <Field label="Powiązane pytania (slugi, jeden w linii)">
            <Lines value={doc.relatedQuestions} onChange={(v) => patch({ relatedQuestions: v })} />
          </Field>
          <Field label="Powiązane instrukcje (slugi, jeden w linii)">
            <Lines value={doc.relatedInstructions} onChange={(v) => patch({ relatedInstructions: v })} />
          </Field>
        </div>
      )}

      {tab === "A · Pytania" && (
        <div className="grid gap-4">
          {doc.situationQuestions.map((q, i) => (
            <div key={q.id} className="card grid gap-3 p-4">
              <Field label={`Pytanie ${i + 1}`}>
                <Text value={q.question} onChange={(v) => patch({ situationQuestions: doc.situationQuestions.map((x, j) => (j === i ? { ...x, question: v } : x)) })} />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Co oznacza „tak”">
                  <Text area value={q.ifYes} onChange={(v) => patch({ situationQuestions: doc.situationQuestions.map((x, j) => (j === i ? { ...x, ifYes: v } : x)) })} />
                </Field>
                <Field label="Co oznacza „nie”">
                  <Text area value={q.ifNo} onChange={(v) => patch({ situationQuestions: doc.situationQuestions.map((x, j) => (j === i ? { ...x, ifNo: v } : x)) })} />
                </Field>
              </div>
              <button type="button" className="btn btn-ghost justify-self-start text-sm text-urgent" onClick={() => patch({ situationQuestions: doc.situationQuestions.filter((_, j) => j !== i) })}>
                Usuń pytanie
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-secondary justify-self-start"
            onClick={() => patch({ situationQuestions: [...doc.situationQuestions, { id: `q-${Date.now().toString(36)}`, question: "", ifYes: "", ifNo: "" }] })}
          >
            Dodaj pytanie
          </button>
        </div>
      )}

      {tab === "B–D · Drogi i kroki" && (
        <div className="grid gap-4">
          {doc.paths.map((p, pi) => (
            <div key={p.id} className="card p-4">
              <button type="button" className="flex w-full items-center justify-between text-left font-extrabold" onClick={() => setOpenPath(openPath === p.id ? null : p.id)} aria-expanded={openPath === p.id}>
                <span>
                  {String(pi + 1).padStart(2, "0")} · {p.name || "(bez nazwy)"} <span className="text-xs font-normal text-muted">id: {p.id}</span>
                </span>
                <span aria-hidden="true">{openPath === p.id ? "−" : "+"}</span>
              </button>
              {openPath === p.id && (
                <div className="mt-4 grid gap-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Nazwa drogi">
                      <Text value={p.name} onChange={(v) => patchPath(pi, { name: v })} />
                    </Field>
                    <Field label="Rodzaj">
                      <select className="field-input" value={p.kind} onChange={(e) => patchPath(pi, { kind: e.target.value as PathKind })}>
                        {Object.entries(PATH_KIND_LABEL).map(([k, l]) => (
                          <option key={k} value={k}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Ilustracja">
                      <IllustrationSelect value={p.illustration} onChange={(v) => patchPath(pi, { illustration: v })} />
                    </Field>
                  </div>
                  <Field label="Opis (jedno zdanie)">
                    <Text area value={p.summary} onChange={(v) => patchPath(pi, { summary: v })} rows={2} />
                  </Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Dla kogo może mieć sens (linie)"><Lines value={p.whenApplicable} onChange={(v) => patchPath(pi, { whenApplicable: v })} /></Field>
                    <Field label="Kiedy raczej się nie sprawdzi (linie)"><Lines value={p.whenNotApplicable} onChange={(v) => patchPath(pi, { whenNotApplicable: v })} /></Field>
                    <Field label="Co można zyskać (linie)"><Lines value={p.benefits} onChange={(v) => patchPath(pi, { benefits: v })} /></Field>
                    <Field label="Ryzyka (linie)"><Lines value={p.risks} onChange={(v) => patchPath(pi, { risks: v })} /></Field>
                    <Field label="Koszty (linie)"><Lines value={p.costs} onChange={(v) => patchPath(pi, { costs: v })} /></Field>
                    <Field label="Warunki (linie)"><Lines value={p.requirements} onChange={(v) => patchPath(pi, { requirements: v })} /></Field>
                  </div>
                  <Field label="Pierwszy krok">
                    <Text value={p.firstStep} onChange={(v) => patchPath(pi, { firstStep: v })} />
                  </Field>
                  <Field label="Źródła drogi (id, oddzielone przecinkami)">
                    <Text value={(p.sourceReferences ?? []).join(", ")} onChange={(v) => patchPath(pi, { sourceReferences: v.split(",").map((x) => x.trim()).filter(Boolean) })} />
                  </Field>
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input type="checkbox" className="h-5 w-5" checked={p.expertHelpAvailable} onChange={(e) => patchPath(pi, { expertHelpAvailable: e.target.checked })} />
                    Na tej drodze pokazuj wybór „Samodzielnie / Z ekspertem”
                  </label>
                  <Field label="D · Dokumenty do przygotowania (jeden w linii)">
                    <Lines
                      value={p.documents.map((d) => d.label)}
                      onChange={(v) => patchPath(pi, { documents: v.map((label, i) => ({ id: p.documents.find((d) => d.label === label)?.id ?? `${p.id}-d${i + 1}-${Date.now().toString(36)}`, label })) })}
                      rows={5}
                    />
                  </Field>

                  <p className="mt-2 font-extrabold">C · Kroki</p>
                  {p.steps.map((s, si) => (
                    <div key={s.id} className="grid gap-3 rounded-md border border-line p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-extrabold tabular-nums">{String(si + 1).padStart(2, "0")}</span>
                        <span className="flex gap-1 text-sm">
                          <button type="button" className="btn btn-ghost min-h-9" disabled={si === 0} onClick={() => { const st = [...p.steps]; [st[si - 1], st[si]] = [st[si], st[si - 1]]; patchPath(pi, { steps: renumber(st, p.id) }); }}>↑</button>
                          <button type="button" className="btn btn-ghost min-h-9" disabled={si === p.steps.length - 1} onClick={() => { const st = [...p.steps]; [st[si + 1], st[si]] = [st[si], st[si + 1]]; patchPath(pi, { steps: renumber(st, p.id) }); }}>↓</button>
                          <button type="button" className="btn btn-ghost min-h-9 text-urgent" onClick={() => patchPath(pi, { steps: renumber(p.steps.filter((_, j) => j !== si), p.id) })}>Usuń</button>
                        </span>
                      </div>
                      <Field label="Tytuł kroku"><Text value={s.title} onChange={(v) => patchStep(pi, si, { title: v })} /></Field>
                      <Field label="Wyjaśnienie"><Text area value={s.explanation} onChange={(v) => patchStep(pi, si, { explanation: v })} /></Field>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Ilustracja"><IllustrationSelect value={s.illustration} onChange={(v) => patchStep(pi, si, { illustration: v })} /></Field>
                        <Field label="Źródła (id, przecinki)"><Text value={(s.sourceReferences ?? []).join(", ")} onChange={(v) => patchStep(pi, si, { sourceReferences: v.split(",").map((x) => x.trim()).filter(Boolean) })} /></Field>
                      </div>
                      <Field label="Lista punktów (linie, opcjonalnie)"><Lines value={s.checklist ?? []} onChange={(v) => patchStep(pi, si, { checklist: v.length ? v : undefined })} /></Field>
                      <Field label="Ostrzeżenie (opcjonalnie)"><Text value={s.warning ?? ""} onChange={(v) => patchStep(pi, si, { warning: v || undefined })} /></Field>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-secondary justify-self-start"
                    onClick={() => patchPath(pi, { steps: renumber([...p.steps, { id: `${p.id}-k${Date.now().toString(36)}`, number: 0, title: "", explanation: "", illustration: "checklist" }], p.id) })}
                  >
                    Dodaj krok
                  </button>
                  <button type="button" className="btn btn-ghost justify-self-start text-urgent" onClick={() => patch({ paths: doc.paths.filter((_, j) => j !== pi) })}>
                    Usuń drogę (pamiętaj o drzewie decyzji)
                  </button>
                </div>
              )}
            </div>
          ))}
          <button
            type="button"
            className="btn btn-secondary justify-self-start"
            onClick={() => {
              const id = `droga-${Date.now().toString(36)}`;
              patch({
                paths: [
                  ...doc.paths,
                  { id, instructionId: doc.id, name: "Nowa droga", summary: "Opis.", kind: "self", illustration: "checklist", whenApplicable: [], whenNotApplicable: [], benefits: [], risks: [], costs: [], requirements: [], firstStep: "Opisz pierwszy krok.", steps: [{ id: `${id}-k1`, number: 1, title: "Pierwszy krok", explanation: "Wyjaśnienie.", illustration: "checklist" }], documents: [], expertHelpAvailable: false },
                ],
              });
              setOpenPath(id);
            }}
          >
            Dodaj drogę
          </button>
        </div>
      )}

      {tab === "E · Ostrzeżenia" && (
        <div className="grid gap-4">
          {doc.warnings.map((w, i) => (
            <div key={w.id} className="card grid gap-3 p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
                <Field label="Tytuł"><Text value={w.title} onChange={(v) => patch({ warnings: doc.warnings.map((x, j) => (j === i ? { ...x, title: v } : x)) })} /></Field>
                <Field label="Waga">
                  <select className="field-input" value={w.severity} onChange={(e) => patch({ warnings: doc.warnings.map((x, j) => (j === i ? { ...x, severity: e.target.value as "urgent" | "important" } : x)) })}>
                    <option value="important">Ważne</option>
                    <option value="urgent">Pilne</option>
                  </select>
                </Field>
              </div>
              <Field label="Wyjaśnienie"><Text area value={w.body} onChange={(v) => patch({ warnings: doc.warnings.map((x, j) => (j === i ? { ...x, body: v } : x)) })} /></Field>
              <button type="button" className="btn btn-ghost justify-self-start text-sm text-urgent" onClick={() => patch({ warnings: doc.warnings.filter((_, j) => j !== i) })}>Usuń</button>
            </div>
          ))}
          <button type="button" className="btn btn-secondary justify-self-start" onClick={() => patch({ warnings: [...doc.warnings, { id: `w-${Date.now().toString(36)}`, title: "", body: "", severity: "important" }] })}>
            Dodaj ostrzeżenie
          </button>
        </div>
      )}

      {tab === "Zaawansowane" && (
        <div className="grid gap-6">
          <p className="text-sm text-muted">Drzewo decyzji, źródła i bezpłatna pomoc są edytowane jako JSON. Przy zapisie sprawdzamy spójność drzewa (czy każde zakończenie daje wynik, czy wyniki wskazują istniejące drogi) i odwołania do źródeł.</p>
          <JsonField label="Drzewo decyzji" value={doc.decisionTree} onChange={(v) => patch({ decisionTree: v })} rows={20} />
          <JsonField label="Źródła (id, title, publisher, url, verifiedAt, confidence: verified|partial|unverified)" value={doc.sourceReferences} onChange={(v) => patch({ sourceReferences: v })} rows={16} />
          <JsonField label="Bezpłatna pomoc" value={doc.freeHelp} onChange={(v) => patch({ freeHelp: v })} rows={8} />
        </div>
      )}
    </div>
  );
}
