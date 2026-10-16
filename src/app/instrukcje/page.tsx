import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { InstructionCard } from "@/components/ui/Cards";
import { CATEGORIES } from "@/content/categories";
import { listPublicInstructions } from "@/lib/repo/content";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Wszystkie instrukcje",
  description: "Instrukcje krok po kroku dla trudnych spraw: długi, komornik, firma, podatki, marka, rozwód, kredyty.",
  alternates: { canonical: "/instrukcje" },
};

export default function AllInstructions() {
  const all = listPublicInstructions().map((v) => v.doc);
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ name: "Instrukcje", href: "/instrukcje" }]} />
      <h1 className="mt-8 text-h1 font-extrabold">Wszystkie instrukcje</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">Każda instrukcja zaczyna się od Twojej sytuacji, pokazuje możliwe drogi i prowadzi krok po kroku.</p>
      {CATEGORIES.map((c) => {
        const items = all.filter((i) => i.category === c.slug);
        if (!items.length) return null;
        return (
          <section key={c.slug} aria-labelledby={`k-${c.slug}`} className="mt-14">
            <h2 id={`k-${c.slug}`} className="text-h2 font-extrabold">
              {c.name}
            </h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((i) => (
                <li key={i.slug}>
                  <InstructionCard i={i} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
