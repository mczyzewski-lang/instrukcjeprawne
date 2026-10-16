import { NextResponse } from "next/server";
import { siteUrl } from "@/lib/config";
import { checklistPdf, instructionPdf } from "@/lib/pdf";
import { getPublicInstruction } from "@/lib/repo/content";

export const runtime = "nodejs";

/** PDF całej instrukcji albo samej listy dokumentów (?lista=idDrogi&zaznaczone=a,b). Bez podawania e-maila. */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const v = getPublicInstruction(slug);
  if (!v) return NextResponse.json({ error: "Nie znaleziono instrukcji" }, { status: 404 });
  const url = `${siteUrl()}/instrukcje/${slug}`;
  const sp = new URL(req.url).searchParams;
  const listPath = sp.get("lista");
  let buf: Buffer;
  let name = `${slug}.pdf`;
  if (listPath) {
    const p = v.doc.paths.find((x) => x.id === listPath);
    if (!p) return NextResponse.json({ error: "Nie znaleziono drogi" }, { status: 404 });
    const checked = (sp.get("zaznaczone") ?? "").split(",").filter((s) => /^[a-z0-9-]{1,80}$/.test(s));
    buf = await checklistPdf(v.doc, p, checked, { url });
    name = `${slug}-lista-${p.id}.pdf`;
  } else {
    buf = await instructionPdf(v.doc, { url, reviewed: v.reviewed });
  }
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${name}"`,
      "cache-control": "public, max-age=300",
      "x-robots-tag": "noindex",
    },
  });
}
