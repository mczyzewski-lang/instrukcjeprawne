"use client";

import { ListChecks } from "lucide-react";
import { useEffect, useState } from "react";
import { getConsent } from "@/lib/analytics-client";

/**
 * Dolny pasek na telefonie z „Wygeneruj bezpłatnie Plan …”.
 * Pojawia się dopiero po przewinięciu poniżej nagłówka instrukcji (hero)
 * i chowa się, gdy na ekranie jest już sam plan, sekcja pomocy z czatem albo pasek zgody.
 */
export function MobilePlanBar({ title, hint, onClick }: { title: string; hint: string; onClick: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const hero = document.querySelector("article > header");
      const pastHero = hero ? hero.getBoundingClientRect().bottom < 0 : window.scrollY > 400;
      const inView = (id: string) => {
        const r = document.getElementById(id)?.getBoundingClientRect();
        return Boolean(r && r.top < window.innerHeight && r.bottom > 0);
      };
      // nie nakładamy się na pasek zgody (też przyklejony do dołu)
      setVisible(pastHero && getConsent() !== null && !inView("plan") && !inView("pomoc"));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      className={`no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-transform duration-150 sm:hidden ${visible ? "translate-y-0" : "translate-y-full"}`}
      style={{ visibility: visible ? "visible" : "hidden" }}
      aria-hidden={!visible}
      data-plan-bar=""
    >
      <button type="button" onClick={onClick} tabIndex={visible ? 0 : -1} className="btn btn-primary btn-glare w-full justify-start gap-3 px-4 py-2.5">
        <ListChecks className="h-6 w-6 shrink-0" aria-hidden="true" />
        <span className="grid min-w-0 text-left">
          <span className="line-clamp-2 leading-snug">{title}</span>
          <span className="text-xs font-semibold text-white/75">{hint}</span>
        </span>
      </button>
    </div>
  );
}
