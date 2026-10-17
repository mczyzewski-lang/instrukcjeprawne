import type { Metadata } from "next";
import Link from "next/link";
import { logoutAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: { default: "Panel", template: "%s | Panel" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const NAV = [
  ["/admin", "Pulpit"],
  ["/admin/instrukcje", "Instrukcje"],
  ["/admin/pytania", "Pytania"],
  ["/admin/ilustracje", "Ilustracje"],
  ["/admin/eksperci", "Eksperci"],
  ["/admin/czaty", "Czaty"],
  ["/admin/leady", "Zgłoszenia"],
  ["/admin/partnerzy", "Partnerzy"],
  ["/admin/analityka", "Analityka"],
  ["/admin/ustawienia", "Ustawienia"],
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const s = await requireAdmin();
  return (
    <div className="container-page py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <nav aria-label="Panel">
          <ul className="flex flex-wrap gap-1 text-sm font-semibold">
            {NAV.map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="block rounded-sm px-3 py-2 no-underline hover:bg-white">{label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <form action={logoutAction} className="flex items-center gap-3 text-sm">
          <span className="text-muted">{s.name}</span>
          <button className="btn btn-ghost min-h-9 text-sm">Wyloguj</button>
        </form>
      </div>
      <div className="py-8">{children}</div>
    </div>
  );
}
