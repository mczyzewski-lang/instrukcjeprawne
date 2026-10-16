import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { listLeads } from "@/lib/repo/leads";

export async function GET() {
  if (!(await getSession())) return new NextResponse("Brak dostępu", { status: 401 });
  const rows = listLeads(10000).map((l) => [l.created_at, l.topic, l.partner, l.name, l.phone, l.email, l.instruction_slug, l.path_id, l.context, l.status]);
  return new NextResponse(toCsv([["data", "temat", "partner", "imie", "telefon", "email", "instrukcja", "droga", "kontekst", "status"], ...rows]), {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="zgloszenia-${new Date().toISOString().slice(0, 10)}.csv"`, "cache-control": "no-store" },
  });
}
