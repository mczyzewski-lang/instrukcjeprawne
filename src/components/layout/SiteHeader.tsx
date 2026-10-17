import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

const NAV = [
  { href: "/instrukcje", label: "Wszystkie instrukcje" },
  { href: "/pytania", label: "Najczęstsze pytania" },
  { href: "/jak-to-dziala", label: "Jak to działa?" },
];

export function SiteHeader() {
  return (
    <header role="banner" className="sticky top-0 z-30 border-b border-line bg-canvas">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Główna nawigacja" className="hidden md:block">
          <ul className="flex items-center gap-7 text-[0.95rem] font-semibold">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="no-underline hover:underline">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <details className="relative md:hidden">
          <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-sm border-2 border-navy px-3 text-sm font-bold [&::-webkit-details-marker]:hidden">
            Menu
          </summary>
          <nav aria-label="Menu mobilne" className="absolute right-0 top-13 w-64 rounded-md border border-line bg-white p-2">
            <ul>
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="block rounded-sm px-3 py-3 font-semibold no-underline hover:bg-canvas">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </details>
      </div>
    </header>
  );
}
