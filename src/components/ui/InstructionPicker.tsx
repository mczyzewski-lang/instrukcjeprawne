"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { track } from "@/lib/analytics-client";

export interface PickerGroup {
  label: string;
  items: { slug: string; title: string }[];
}

/**
 * „Wybierz instrukcję prawną” – lista wszystkich instrukcji pogrupowanych w działy.
 * Przejście dopiero po kliknięciu przycisku (samo wybranie z listy nie zmienia strony – WCAG 3.2.2).
 */
export function InstructionPicker({ groups }: { groups: PickerGroup[] }) {
  const router = useRouter();
  const id = useId();
  const [slug, setSlug] = useState("");
  const [error, setError] = useState(false);

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) {
      setError(true);
      return;
    }
    track("search_performed", { props: { source: "picker" } });
    router.push(`/instrukcje/${slug}`);
  };

  return (
    <form onSubmit={go} className="w-full">
      <label htmlFor={id} className="mb-3 block text-lg font-bold sm:text-xl">
        Wybierz instrukcję prawną:
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          id={id}
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setError(false);
          }}
          aria-invalid={error}
          aria-describedby={error ? `${id}-err` : undefined}
          className="field-input min-h-14 flex-1 border-navy text-base font-semibold"
        >
          <option value="">— wybierz z listy —</option>
          {groups.map((g) => (
            <optgroup key={g.label} label={g.label}>
              {g.items.map((i) => (
                <option key={i.slug} value={i.slug}>
                  {i.title}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <button type="submit" className="btn btn-primary min-h-14 shrink-0">
          Otwórz instrukcję <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {error && (
        <p id={`${id}-err`} className="field-error">
          Wybierz instrukcję z listy.
        </p>
      )}
    </form>
  );
}
