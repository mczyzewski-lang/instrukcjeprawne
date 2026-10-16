"use client";

import { useEffect, useState } from "react";
import { getConsent, setConsent } from "@/lib/analytics-client";

/**
 * Niewielki, niemodalny pasek zgody – nie zasłania instrukcji (zajmuje miejsce u dołu, bez przyciemniania).
 * Domyślnie analityka jest wyłączona. Oba przyciski są równorzędne.
 */
export function ConsentBar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- odczyt localStorage możliwy dopiero po hydratacji
    setOpen(getConsent() === null);
    const reopen = () => setOpen(true);
    window.addEventListener("ip-consent-open", reopen);
    return () => window.removeEventListener("ip-consent-open", reopen);
  }, []);

  if (!open) return null;
  const decide = (v: "granted" | "denied") => {
    setConsent(v);
    setOpen(false);
  };
  return (
    <div role="region" aria-label="Ustawienia prywatności" className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white">
      <div className="container-page flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          Czy możemy liczyć anonimowo, które kroki instrukcji są przydatne? Bez ciasteczek reklamowych i bez danych osobowych.{" "}
          <a href="/polityka-prywatnosci#analityka" className="underline">
            Szczegóły
          </a>
        </p>
        <div className="flex shrink-0 gap-2">
          <button type="button" className="btn btn-secondary min-h-10 px-4 py-2 text-sm" onClick={() => decide("denied")}>
            Nie, dziękuję
          </button>
          <button type="button" className="btn btn-secondary min-h-10 px-4 py-2 text-sm" onClick={() => decide("granted")}>
            Zgadzam się
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConsentSettingsButton() {
  return (
    <button type="button" className="underline hover:text-navy" onClick={() => window.dispatchEvent(new Event("ip-consent-open"))}>
      Ustawienia prywatności
    </button>
  );
}
