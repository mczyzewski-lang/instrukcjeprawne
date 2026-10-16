import { NextResponse } from "next/server";
import { isProduction } from "@/lib/config";
import { createLead } from "@/lib/repo/leads";
import { rateLimit } from "@/lib/repo/rate-limit";
import { leadSchema } from "@/lib/schemas";

export const runtime = "nodejs";

const MIN_FILL_MS = 2500;

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
  if (!rateLimit(`lead:${ip}`, 5, 3600)) {
    return NextResponse.json({ ok: false, error: "Zbyt wiele zgłoszeń z tego urządzenia. Spróbuj ponownie później." }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Niepoprawne dane formularza." }, { status: 400 });
  }
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = String(i.path[0] ?? "form");
      if (k === "website" || k === "startedAt") continue;
      fieldErrors[k] ??= i.message;
    }
    // pułapka antyspamowa – udajemy sukces, nic nie zapisujemy
    if (parsed.error.issues.some((i) => i.path[0] === "website")) return NextResponse.json({ ok: true });
    return NextResponse.json({ ok: false, error: "Popraw zaznaczone pola.", fieldErrors }, { status: 422 });
  }
  if (Date.now() - parsed.data.startedAt < MIN_FILL_MS) return NextResponse.json({ ok: true });

  const result = await createLead(parsed.data, { userAgent: req.headers.get("user-agent") ?? undefined });
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, localMode: !isProduction() && !result.forwarded });
}
