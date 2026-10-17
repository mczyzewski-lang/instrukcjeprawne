"use client";

import { ListChecks } from "lucide-react";

/** Główne CTA strony instrukcji: „Wygeneruj bezpłatnie Plan …” z drugim wierszem i delikatnym błyskiem. */
export function PlanCtaButton({ label, onClick, className = "" }: { label: string; onClick: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} className={`btn btn-primary btn-glare flex-col items-start gap-0.5 px-5 py-3 text-left ${className}`}>
      <span className="flex items-center gap-2">
        <ListChecks className="h-5 w-5 shrink-0" aria-hidden="true" />
        {label}
      </span>
      <span className="pl-7 text-xs font-semibold text-white/75">Bez podawania danych kontaktowych</span>
    </button>
  );
}
