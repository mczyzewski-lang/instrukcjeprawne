import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/content/categories";
import { siteUrl } from "@/lib/config";
import { listPublicInstructions, listPublicQuestions } from "@/lib/repo/content";

export const revalidate = 3600;

/** Do sitemap trafiają wyłącznie treści zatwierdzone przez człowieka. Szkice i wersje robocze – nie. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const ins = listPublicInstructions().filter((v) => v.reviewed);
  const qs = listPublicQuestions().filter((v) => v.reviewed);
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/instrukcje`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/pytania`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/jak-to-dziala`, changeFrequency: "monthly", priority: 0.4 },
    ...CATEGORIES.map((c) => ({ url: `${base}/kategorie/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...ins.map((v) => ({ url: `${base}/instrukcje/${v.doc.slug}`, lastModified: v.doc.updatedAt, changeFrequency: "monthly" as const, priority: 0.9 })),
    ...qs.map((v) => ({ url: `${base}/pytania/${v.doc.slug}`, lastModified: v.doc.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
