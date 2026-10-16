import Link from "next/link";
import { CATEGORIES } from "@/content/categories";
import { LogoMark } from "@/components/ui/Logo";
import { ConsentSettingsButton } from "./ConsentBar";

export function SiteFooter() {
  return (
    <footer role="contentinfo" className="mt-24 border-t border-line bg-white">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-md">
          <div className="flex items-center gap-2 font-extrabold tracking-[0.12em]">
            <LogoMark className="h-6 w-6" /> INSTRUKCJE PRAWNE<span className="text-gold">.</span>
          </div>
          <p className="mt-4 text-sm text-muted">
            Portal dostarcza informacji ogólnych i nie jest indywidualną opinią prawną. Każda sytuacja może wymagać oceny konkretnych dokumentów. Przy
            każdej instrukcji podajemy źródła i datę weryfikacji.
          </p>
          <p className="mt-3 text-sm text-muted">
            Część rozmów z ekspertami prowadzą współpracujące z portalem podmioty komercyjne. Informujemy o tym zawsze przed kontaktem.
          </p>
        </div>
        <nav aria-label="Kategorie">
          <p className="eyebrow mb-3">Kategorie</p>
          <ul className="space-y-2 text-sm">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/kategorie/${c.slug}`} className="hover:underline">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Informacje">
          <p className="eyebrow mb-3">Portal</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/instrukcje" className="hover:underline">Wszystkie instrukcje</Link></li>
            <li><Link href="/pytania" className="hover:underline">Najczęstsze pytania</Link></li>
            <li><Link href="/jak-to-dziala" className="hover:underline">Jak to działa?</Link></li>
            <li><Link href="/jak-to-dziala#zrodla" className="hover:underline">Źródła i weryfikacja treści</Link></li>
            <li><Link href="/polityka-prywatnosci" className="hover:underline">Polityka prywatności</Link></li>
            <li><ConsentSettingsButton /></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-line">
        <p className="container-page py-5 text-xs text-muted">© {new Date().getFullYear()} InstrukcjePrawne.pl · Informacje ogólne, nie porada prawna.</p>
      </div>
    </footer>
  );
}
