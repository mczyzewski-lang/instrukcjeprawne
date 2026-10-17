"use client";

import { useEffect, useState } from "react";
import { store } from "@/lib/analytics-client";
import type { SituationQuestion } from "@/lib/types";

export const situationKey = (slug: string) => `ip:${slug}:sytuacja`;

/**
 * Sekcja A – pytania orientacyjne. Odpowiedź pokazuje, co oznacza dla dalszych kroków.
 * Odpowiedzi zostają tylko w tej przeglądarce – korzysta z nich „Plan …”.
 */
export function SituationQuestions({ questions, slug }: { questions: SituationQuestion[]; slug: string }) {
  const [answers, setAnswersState] = useState<Record<string, "tak" | "nie">>({});
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- odpowiedzi z localStorage dostępne po hydratacji
    setAnswersState(store.get<Record<string, "tak" | "nie">>(situationKey(slug), {}));
  }, [slug]);
  const setAnswers = (fn: (s: Record<string, "tak" | "nie">) => Record<string, "tak" | "nie">) =>
    setAnswersState((s) => {
      const next = fn(s);
      store.set(situationKey(slug), next);
      return next;
    });
  return (
    <ol className="mt-8 grid gap-3">
      {questions.map((q, i) => {
        const a = answers[q.id];
        return (
          <li key={q.id} className="card p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-bold">
                <span className="mr-3 tabular-nums text-muted">{String(i + 1).padStart(2, "0")}</span>
                {q.question}
              </p>
              <div className="no-print flex shrink-0 gap-2" role="group" aria-label={q.question}>
                {(["tak", "nie"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={a === v}
                    onClick={() => setAnswers((s) => ({ ...s, [q.id]: v }))}
                    className={`min-h-11 min-w-16 rounded-sm border-2 px-4 font-bold capitalize ${a === v ? "border-navy bg-navy text-white" : "border-line bg-white hover:border-navy"}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div aria-live="polite">
              {a && (
                <p className="mt-4 rounded-sm border-l-4 border-gold bg-gold-soft px-4 py-3 text-base leading-relaxed sm:text-lg">
                  <span className="mb-0.5 block text-xs font-extrabold uppercase tracking-wider text-navy">Co to oznacza</span>
                  <span className="font-semibold">{a === "tak" ? q.ifYes : q.ifNo}</span>
                </p>
              )}
            </div>
            <div className="print-only mt-2 text-sm">
              <p>Tak: {q.ifYes}</p>
              <p>Nie: {q.ifNo}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
