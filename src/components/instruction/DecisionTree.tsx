"use client";

import { ArrowLeft, Link2, Printer, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { track } from "@/lib/analytics-client";
import { decodeAnswers, encodeAnswers, resolve } from "@/lib/decision-engine";
import type { DecisionTree as Tree } from "@/lib/types";

interface Props {
  tree: Tree;
  instructionSlug: string;
  pathNames: Record<string, string>;
  instructionTitles: Record<string, string>;
  onSelectPath: (pathId: string) => void;
  onResult?: (pathIds: string[]) => void;
  /** bieżące odpowiedzi (np. do „Planu …”) */
  onAnswersChange?: (optionIds: string[]) => void;
  /** przycisk pod wynikiem, np. „Wygeneruj bezpłatnie Plan oddłużenia” */
  planCta?: { label: string; onClick: () => void };
}

/**
 * Uniwersalne drzewo decyzji konfigurowane danymi.
 * Stan = lista wybranych odpowiedzi; można się cofnąć, zacząć od nowa, udostępnić link (?odp=) i wydrukować podsumowanie.
 */
export function DecisionTree({ tree, instructionSlug, pathNames, instructionTitles, onSelectPath, onResult, onAnswersChange, planCta }: Props) {
  const [answers, setAnswers] = useState<string[]>([]);
  const [shareMsg, setShareMsg] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const focusNext = useRef(false);
  const state = useMemo(() => resolve(tree, answers), [tree, answers]);

  // odtworzenie wyniku z udostępnionego linku
  useEffect(() => {
    const fromUrl = decodeAnswers(new URLSearchParams(window.location.search).get("odp"));
    if (fromUrl.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- parametr URL dostępny dopiero w przeglądarce
      setAnswers(resolve(tree, fromUrl).answers.map((a) => a.optionId));
    }
  }, [tree]);

  useEffect(() => {
    if (focusNext.current) {
      headingRef.current?.focus();
      focusNext.current = false;
    }
    if (state.complete) onResult?.(state.outcomes.flatMap((o) => o.pathIds));
    onAnswersChange?.(state.answers.map((a) => a.optionId));
  }, [state, onResult, onAnswersChange]);

  const choose = (optionId: string) => {
    if (answers.length === 0) track("decision_tree_started", { instructionSlug });
    const next = [...answers, optionId];
    const r = resolve(tree, next);
    track("decision_answer_selected", { instructionSlug, props: { node: state.node?.id ?? "", option: optionId } });
    if (r.complete) track("decision_tree_completed", { instructionSlug, props: { outcomes: r.outcomes.length, uncertain: r.uncertain } });
    focusNext.current = true;
    setAnswers(next);
    setShareMsg("");
  };

  const back = () => {
    focusNext.current = true;
    setAnswers((a) => a.slice(0, -1));
  };
  const restart = () => {
    focusNext.current = true;
    setAnswers([]);
    setShareMsg("");
    const url = new URL(window.location.href);
    url.searchParams.delete("odp");
    window.history.replaceState(null, "", url.toString());
  };

  const shareUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("odp", encodeAnswers(answers));
    url.hash = "drzewo";
    return url.toString();
  };

  const share = async () => {
    const url = shareUrl();
    window.history.replaceState(null, "", url);
    try {
      if (navigator.share) {
        await navigator.share({ title: tree.title, url });
        setShareMsg("Link udostępniony.");
      } else {
        await navigator.clipboard.writeText(url);
        setShareMsg("Link do wyniku skopiowany do schowka.");
      }
    } catch {
      setShareMsg(`Skopiuj link: ${url}`);
    }
  };

  const pct = state.progress.total ? Math.round((state.progress.answered / state.progress.total) * 100) : 0;

  return (
    <div id="drzewo" className="card overflow-hidden">
      <div className="border-b border-line px-5 py-4 sm:px-7">
        <p className="font-extrabold">{tree.title}</p>
        <p className="mt-1 text-sm text-muted">{tree.intro}</p>
        <div className="mt-4 flex items-center gap-3" aria-hidden="true">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
            <div className="h-full bg-navy transition-[width]" style={{ width: `${state.complete ? 100 : pct}%` }} />
          </div>
          <span className="text-xs font-semibold tabular-nums text-muted">
            {state.complete ? "Gotowe" : `${state.progress.answered + 1} / ${state.progress.total}`}
          </span>
        </div>
      </div>

      <div className="px-5 py-6 sm:px-7" aria-live="polite">
        {!state.complete && state.node && (
          <fieldset>
            <legend className="w-full">
              <span className="sr-only">
                Pytanie {state.progress.answered + 1} z {state.progress.total}:{" "}
              </span>
              <h3 ref={headingRef} tabIndex={-1} className="text-xl font-extrabold outline-none sm:text-2xl">
                {state.node.question}
              </h3>
            </legend>
            {state.node.help && <p className="mt-2 text-sm text-muted">{state.node.help}</p>}
            <ul className="mt-5 grid gap-2.5">
              {state.node.options.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => choose(o.id)}
                    className="flex min-h-14 w-full items-center justify-between gap-3 rounded-md border-2 border-line bg-white px-4 py-3 text-left font-semibold transition-colors hover:border-navy focus-visible:border-navy"
                  >
                    {o.label}
                    <span aria-hidden="true" className="text-muted">
                      →
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </fieldset>
        )}

        {state.complete && (
          <div>
            <h3 ref={headingRef} tabIndex={-1} className="text-xl font-extrabold outline-none sm:text-2xl">
              Drogi warte sprawdzenia w Twojej sytuacji
            </h3>
            <p className="mt-2 text-sm text-muted">
              To orientacja na podstawie kilku odpowiedzi, a nie ocena prawna. Ostateczny wybór zależy od szczegółów Twojej sprawy i dokumentów.
            </p>
            {state.uncertain && (
              <p className="mt-4 rounded-md border border-gold bg-gold-soft px-4 py-3 text-sm">
                Przy części pytań wybrano „nie wiem”. Wynik jest niepełny – uzupełnij te informacje, zanim podejmiesz decyzję.
              </p>
            )}
            <ol className="mt-5 grid gap-3">
              {state.outcomes.map((o, idx) => (
                <li key={o.id} className={`rounded-md border p-4 ${o.urgent ? "border-urgent bg-urgent-soft" : "border-line bg-white"}`}>
                  <p className="flex items-baseline gap-3">
                    <span className="font-extrabold tabular-nums text-muted">{String(idx + 1).padStart(2, "0")}</span>
                    <span className="font-extrabold">
                      {o.urgent && <span className="mr-2 text-urgent">Pilne:</span>}
                      {o.title}
                    </span>
                  </p>
                  <p className="mt-1.5 pl-9 text-sm">{o.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2 pl-9">
                    {o.pathIds.map((pid) => (
                      <button key={pid} type="button" className="btn btn-secondary min-h-10 px-3 py-1.5 text-sm" onClick={() => onSelectPath(pid)}>
                        {pathNames[pid] ?? pid} →
                      </button>
                    ))}
                    {o.instructionSlug && (
                      <a href={`/instrukcje/${o.instructionSlug}`} className="btn btn-secondary min-h-10 px-3 py-1.5 text-sm">
                        {instructionTitles[o.instructionSlug] ?? "Zobacz instrukcję"} →
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ol>
            {planCta && (
              <div className="mt-5 rounded-md border-2 border-navy bg-white p-4">
                <p className="font-extrabold">Zbierz to w jeden plan</p>
                <p className="mt-1 text-sm text-muted">Twoje odpowiedzi, wybrana droga, kroki i dokumenty – jako lista do odhaczania i PDF. Bez rejestracji.</p>
                <button type="button" className="btn btn-primary mt-3 w-full sm:w-auto" onClick={planCta.onClick}>
                  {planCta.label}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="no-print flex flex-wrap items-center gap-2 border-t border-line px-5 py-3 sm:px-7">
        <button type="button" className="btn btn-ghost min-h-10 text-sm" onClick={back} disabled={answers.length === 0}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Wstecz
        </button>
        <button type="button" className="btn btn-ghost min-h-10 text-sm" onClick={restart} disabled={answers.length === 0}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" /> Od nowa
        </button>
        {state.complete && (
          <>
            <button type="button" className="btn btn-ghost min-h-10 text-sm" onClick={share}>
              <Link2 className="h-4 w-4" aria-hidden="true" /> Udostępnij wynik
            </button>
            <a className="btn btn-ghost min-h-10 text-sm" href={`/instrukcje/${instructionSlug}/wynik?odp=${encodeAnswers(answers)}`} target="_blank" rel="noopener">
              <Printer className="h-4 w-4" aria-hidden="true" /> Drukuj podsumowanie
            </a>
          </>
        )}
        <p role="status" className="w-full break-all text-sm text-muted empty:hidden">
          {shareMsg}
        </p>
      </div>
    </div>
  );
}
