import { NextResponse } from "next/server";
import { getPublicInstruction } from "@/lib/repo/content";
import { sendEmailMessage } from "@/lib/repo/chats";
import { expertFor } from "@/lib/repo/experts";
import { rateLimit } from "@/lib/repo/rate-limit";
import { emailMessageSchema } from "@/lib/schemas";

export const runtime = "nodejs";

/** Wiadomość e-mail do eksperta wysyłana formularzem na stronie (bez mailto:). */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`mail:${ip}`, 5, 3600)) return NextResponse.json({ ok: false, error: "Zbyt wiele wiadomości z tego urządzenia. Spróbuj później." }, { status: 429 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Niepoprawne dane." }, { status: 400 });
  }
  const parsed = emailMessageSchema.safeParse(body);
  if (!parsed.success) {
    if (parsed.error.issues.some((i) => i.path[0] === "website")) return NextResponse.json({ ok: false, error: "Nie udało się wysłać wiadomości." }, { status: 400 });
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0] ?? "form")] ??= i.message;
    return NextResponse.json({ ok: false, error: "Popraw zaznaczone dane.", fieldErrors }, { status: 422 });
  }
  if (Date.now() - parsed.data.startedAt < 3000) return NextResponse.json({ ok: false, error: "Spróbuj ponownie za chwilę." }, { status: 429 });
  const ins = parsed.data.instructionSlug ? getPublicInstruction(parsed.data.instructionSlug)?.doc : null;
  const ex = ins ? expertFor(ins.category, ins.expertId) : null;
  const r = await sendEmailMessage(parsed.data, {
    expertId: ex?.expert.id,
    expertName: ex && !ex.placeholder ? ex.expert.name : undefined,
    expertEmail: ex?.expert.email,
    instructionTitle: ins?.title,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });
  if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
