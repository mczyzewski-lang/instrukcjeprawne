import { NextResponse } from "next/server";
import { z } from "zod";
import { EVENT_NAMES, recordEvent } from "@/lib/repo/events";
import { rateLimit } from "@/lib/repo/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  name: z.enum(EVENT_NAMES),
  sessionId: z.string().max(40).optional(),
  instructionSlug: z.string().max(120).optional(),
  pathId: z.string().max(80).optional(),
  props: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

/** Odbiór zdarzeń analitycznych (wysyłanych tylko po zgodzie). Nie zapisujemy IP. */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`ev:${ip}`, 300, 3600)) return new NextResponse(null, { status: 204 });
  try {
    const parsed = schema.safeParse(await req.json());
    if (parsed.success) recordEvent(parsed.data);
  } catch {
    /* ignorujemy niepoprawne zdarzenia */
  }
  return new NextResponse(null, { status: 204 });
}
