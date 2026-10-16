import "server-only";
import { listPublicInstructions, listPublicQuestions } from "./repo/content";
import type { SearchDoc } from "./search";

/** Buduje indeks wyszukiwania z treści widocznych publicznie. */
export function buildSearchDocs(): SearchDoc[] {
  const docs: SearchDoc[] = [];
  for (const { doc: i } of listPublicInstructions()) {
    docs.push({
      type: "instruction",
      title: i.title,
      url: `/instrukcje/${i.slug}`,
      snippet: i.subtitle,
      body: `${i.shortDescription} ${i.situationQuestions.map((q) => q.question).join(" ")}`,
      category: i.category,
    });
    for (const p of i.paths) {
      docs.push({
        type: "path",
        title: p.name,
        url: `/instrukcje/${i.slug}#droga-${p.id}`,
        snippet: `${i.title} – ${p.summary}`,
        body: `${p.whenApplicable.join(" ")} ${p.steps.map((s) => s.title).join(" ")}`,
        category: i.category,
      });
    }
  }
  for (const { doc: q } of listPublicQuestions()) {
    docs.push({ type: "question", title: q.title, url: `/pytania/${q.slug}`, snippet: q.answer.slice(0, 160), body: q.actions.join(" "), category: q.category });
  }
  return docs;
}
