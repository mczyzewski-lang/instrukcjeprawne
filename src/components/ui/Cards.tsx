import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Category, Instruction } from "@/lib/types";
import { Illustration } from "./Illustration";

export function countSteps(i: Instruction) {
  return i.paths.reduce((n, p) => n + p.steps.length, 0);
}

const pl = (n: number, one: string, few: string, many: string) => {
  if (n === 1) return one;
  const m10 = n % 10;
  const m100 = n % 100;
  return m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many;
};

export const plural = pl;

export function InstructionCard({ i, headingLevel = 3 }: { i: Instruction; headingLevel?: 2 | 3 }) {
  const H = `h${headingLevel}` as "h2" | "h3";
  return (
    <Link href={`/instrukcje/${i.slug}`} className="card group flex h-full flex-col p-5 no-underline transition-colors hover:border-navy sm:p-6">
      <Illustration id={i.illustration} decorative className="mb-4 w-32 sm:w-36" />
      <H className="text-lg font-extrabold leading-snug sm:text-xl">{i.title}</H>
      <p className="mt-2 line-clamp-3 text-sm text-muted">{i.shortDescription}</p>
      <p className="mt-auto flex items-center justify-between pt-5 text-sm font-semibold">
        <span>
          {i.paths.length} {pl(i.paths.length, "droga", "drogi", "dróg")} · {countSteps(i)} {pl(countSteps(i), "krok", "kroki", "kroków")}
        </span>
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </p>
    </Link>
  );
}

export function CategoryCard({ c, count }: { c: Category; count: number }) {
  return (
    <Link href={`/kategorie/${c.slug}`} className="card group flex items-center gap-4 p-4 no-underline transition-colors hover:border-navy sm:flex-col sm:items-start sm:p-5">
      <Illustration id={c.illustration} decorative className="w-20 shrink-0 sm:w-24" />
      <span>
        <span className="block font-extrabold leading-snug">{c.name}</span>
        <span className="mt-1 block text-sm text-muted">
          {count > 0 ? `${count} ${pl(count, "instrukcja", "instrukcje", "instrukcji")}` : "Pytania i odpowiedzi"}
        </span>
      </span>
    </Link>
  );
}
