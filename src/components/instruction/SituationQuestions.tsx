"use client";

import { useState } from "react";
import type { SituationQuestion } from "@/lib/types";

/** Sekcja A – pytania orientacyjne. Odpowiedź pokazuje, co oznacza dla dalszych kroków. Nic nie zapisujemy. */
export function SituationQuestions({ questions }: { questions: SituationQuestion[] }) {
  const [answers, setAnswers] = useState<Record<string, "tak" | "nie">>({});
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
              {a && <p className="mt-3 border-l-2 border-gold pl-3 text-sm">{a === "tak" ? q.ifYes : q.ifNo}</p>}
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
