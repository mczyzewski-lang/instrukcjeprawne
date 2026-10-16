import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InstructionView } from "@/components/instruction/InstructionView";
import { SITE_NAME } from "@/lib/config";
import { getPublicInstruction, listPublicInstructions } from "@/lib/repo/content";
export const revalidate = 300;

export function generateStaticParams() {
  return listPublicInstructions().map((v) => ({ slug: v.doc.slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const v = getPublicInstruction(slug);
  if (!v) return { title: "Nie znaleziono instrukcji", robots: { index: false } };
  const url = `/instrukcje/${slug}`;
  return {
    title: v.doc.title,
    description: v.doc.shortDescription,
    alternates: { canonical: url },
    openGraph: { title: v.doc.title, description: v.doc.shortDescription, url, type: "article", siteName: SITE_NAME },
    robots: v.reviewed ? undefined : { index: false, follow: true },
  };
}

export default async function InstructionPage({ params }: Params) {
  const { slug } = await params;
  const v = getPublicInstruction(slug);
  if (!v) notFound();
  return <InstructionView ins={v.doc} reviewed={v.reviewed} />;
}
