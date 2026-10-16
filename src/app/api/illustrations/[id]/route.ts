import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { readIllustrationFile } from "@/lib/illustration-generator";

export const runtime = "nodejs";

/** Serwuje grafiki. Publicznie – tylko zatwierdzone; pozostałe (do przeglądu) – tylko administratorowi. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new NextResponse(null, { status: 404 });
  const row = getDb().prepare("SELECT status FROM illustrations WHERE id = ?").get(id) as { status: string } | undefined;
  if (!row) return new NextResponse(null, { status: 404 });
  const isPublic = row.status === "approved" || row.status === "manual";
  if (!isPublic && !(await getSession())) return new NextResponse(null, { status: 404 });
  const file = readIllustrationFile(id);
  if (!file) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(file.data), {
    headers: { "content-type": file.mime, "cache-control": isPublic ? "public, max-age=31536000, immutable" : "private, no-store" },
  });
}
