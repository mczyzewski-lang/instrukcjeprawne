import { describe, expect, it } from "vitest";
import { parseCsv, questionsFromCsv, questionsToCsv } from "@/lib/csv";
import { parseQuestion } from "@/lib/schemas";

describe("CSV", () => {
  it("parsuje cudzysłowy, przecinki i nowe linie", () => {
    const rows = parseCsv('a,b\n"x, y","linia 1\nlinia 2"\n"cytat ""z"" tekstem",2\n');
    expect(rows).toEqual([["a", "b"], ["x, y", "linia 1\nlinia 2"], ['cytat "z" tekstem', "2"]]);
  });
  it("wykrywa średnik jako separator (Excel PL)", () => {
    expect(parseCsv("title;category\nPytanie;inne-sprawy")).toEqual([["title", "category"], ["Pytanie", "inne-sprawy"]]);
  });
  it("importuje pytania jako szkice i raportuje błędy", () => {
    const csv = [
      "title,category,answer,actions,sourceUrl,videoPlatform,videoUrl",
      'Czy komornik może zająć rower?,dlugi-i-komornik,"Krótka odpowiedź testowa.",Krok 1 | Krok 2,https://www.gov.pl/x,youtube,https://youtube.com/shorts/abc',
      "Zła,nieznana,,,,,",
    ].join("\n");
    const out = questionsFromCsv(csv, "2026-10-16");
    expect(out).toHaveLength(2);
    const q = out[0].question!;
    expect(q.slug).toBe("czy-komornik-moze-zajac-rower");
    expect(q.status).toBe("draft");
    expect(q.actions).toEqual(["Krok 1", "Krok 2"]);
    expect(q.relatedVideo?.platform).toBe("youtube");
    expect(parseQuestion(q).ok).toBe(true);
    expect(out[1].errors.length).toBeGreaterThan(0);
  });
  it("eksport i ponowny import są zgodne", () => {
    const [{ question }] = questionsFromCsv("title,category,actions\nCzy można testować eksport?,inne-sprawy,A | B");
    const again = questionsFromCsv(questionsToCsv([question!]));
    expect(again[0].question?.title).toBe("Czy można testować eksport?");
    expect(again[0].question?.actions).toEqual(["A", "B"]);
  });
});
