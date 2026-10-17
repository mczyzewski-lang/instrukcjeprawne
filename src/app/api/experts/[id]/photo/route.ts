import { NextResponse } from "next/server";
import { readExpertPhoto } from "@/lib/repo/experts";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-z0-9-]{1,80}$/.test(id)) return new NextResponse(null, { status: 404 });
  const photo = readExpertPhoto(id);
  if (!photo) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(photo.data), { headers: { "content-type": photo.mime, "cache-control": "public, max-age=3600" } });
}
