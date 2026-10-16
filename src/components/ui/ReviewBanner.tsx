import { Info } from "lucide-react";

export function ReviewBanner({ kind = "instrukcja" }: { kind?: "instrukcja" | "odpowiedź" }) {
  return (
    <div role="note" className="flex gap-3 rounded-md border border-gold bg-gold-soft px-4 py-3 text-sm">
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>
        <strong>Wersja robocza.</strong> Ta {kind} została przygotowana na podstawie researchu źródeł urzędowych z pomocą narzędzi AI i czeka na
        weryfikację przez prawnika. Korzystaj z niej jako z orientacji i sprawdzaj wskazane źródła.
      </p>
    </div>
  );
}
