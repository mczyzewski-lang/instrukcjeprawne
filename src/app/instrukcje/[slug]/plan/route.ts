import { NextResponse } from "next/server";
import { siteUrl } from "@/lib/config";
import { planPdf } from "@/lib/pdf";
import { buildPlan, decodePlan, planFileTitle, planPdfHref } from "@/lib/plan";
import { getPublicInstruction } from "@/lib/repo/content";

export const runtime = "nodejs";

/** PDF „Planu …” odtworzony z kodu odpowiedzi (?d=…). Bez zapisywania danych i bez e-maila. */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const v = getPublicInstruction(slug);
  if (!v) return NextResponse.json({ error: "Nie znaleziono instrukcji" }, { status: 404 });
  const code = new URL(req.url).searchParams.get("d");
  const input = decodePlan(code);
  if (!input || !code) return NextResponse.json({ error: "Niepoprawny kod planu" }, { status: 400 });
  const plan = buildPlan(v.doc, input);
  const buf = await planPdf(v.doc, plan, { url: `${siteUrl()}/instrukcje/${slug}`, planUrl: `${siteUrl()}${planPdfHref(slug, code)}` });
  const title = planFileTitle(plan);
  const ascii = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[łŁ]/g, "l").replace(/[^A-Za-z0-9().-]+/g, "-");
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="${ascii}.pdf"; filename*=UTF-8''${encodeURIComponent(`${title}.pdf`)}`,
      "cache-control": "private, max-age=300",
      "x-robots-tag": "noindex",
    },
  });
}
