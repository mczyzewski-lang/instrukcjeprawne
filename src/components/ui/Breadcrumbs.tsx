import Link from "next/link";
import { siteUrl } from "@/lib/config";

export interface Crumb {
  name: string;
  href: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all = [{ name: "Start", href: "/" }, ...items];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: `${siteUrl()}${c.href}` })),
  };
  return (
    <nav aria-label="Ścieżka nawigacji" className="no-print">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
        {all.map((c, i) => (
          <li key={c.href} className="flex items-center gap-2">
            {i < all.length - 1 ? (
              <>
                <Link href={c.href} className="hover:text-navy">
                  {c.name}
                </Link>
                <span aria-hidden="true">/</span>
              </>
            ) : (
              <span aria-current="page" className="text-navy">
                {c.name}
              </span>
            )}
          </li>
        ))}
      </ol>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </nav>
  );
}
