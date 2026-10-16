import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { questionsToCsv } from "@/lib/csv";
import { getQuestionForEdit, listAdminQuestions } from "@/lib/repo/content";

export async function GET() {
  if (!(await getSession())) return new NextResponse("Brak dostępu", { status: 401 });
  const qs = listAdminQuestions().map((i) => getQuestionForEdit(i.id)!.draft);
  return new NextResponse(questionsToCsv(qs), {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="pytania-${new Date().toISOString().slice(0, 10)}.csv"` },
  });
}
