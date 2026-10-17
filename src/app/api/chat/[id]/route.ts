import { NextResponse } from "next/server";
import { addMessage, listMessages, markSeen, planAttachment, verifyChatToken } from "@/lib/repo/chats";
import { getPublicInstruction } from "@/lib/repo/content";
import { rateLimit } from "@/lib/repo/rate-limit";
import { chatMessageSchema } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Pobranie wiadomości rozmowy (token w nagłówku x-chat-token). */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.headers.get("x-chat-token") ?? "";
  const chat = verifyChatToken(id, token);
  if (!chat) return NextResponse.json({ ok: false }, { status: 404 });
  const after = Number(new URL(req.url).searchParams.get("po")) || 0;
  markSeen(id, "user");
  return NextResponse.json({ ok: true, status: chat.status, messages: listMessages(id, after) }, { headers: { "cache-control": "no-store" } });
}

/** Kolejna wiadomość użytkownika. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`chatmsg:${ip}`, 30, 3600)) return NextResponse.json({ ok: false, error: "Zbyt wiele wiadomości. Spróbuj później." }, { status: 429 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Niepoprawne dane." }, { status: 400 });
  }
  const parsed = chatMessageSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Niepoprawna wiadomość." }, { status: 422 });
  const chat = verifyChatToken(id, parsed.data.token);
  if (!chat) return NextResponse.json({ ok: false, error: "Nie znaleziono rozmowy." }, { status: 404 });
  if (chat.status === "closed") return NextResponse.json({ ok: false, error: "Ta rozmowa została zamknięta." }, { status: 409 });
  const ins = chat.instruction_slug ? getPublicInstruction(chat.instruction_slug)?.doc : null;
  addMessage(id, "user", chat.name, parsed.data.message, planAttachment(ins, parsed.data.plan));
  markSeen(id, "user");
  return NextResponse.json({ ok: true });
}
