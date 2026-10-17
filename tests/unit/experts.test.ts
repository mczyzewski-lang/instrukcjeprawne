import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetDbForTests } from "@/lib/db";
import { expertFor, getExpert, saveExpert } from "@/lib/repo/experts";
import { getPublicQuestion } from "@/lib/repo/content";

beforeEach(() => {
  resetDbForTests();
  vi.unstubAllEnvs();
});

describe("eksperci nadzorujący działy", () => {
  it("szkic eksperta widać tylko w trybie treści roboczych, oznaczony jako do uzupełnienia", () => {
    expect(expertFor("dlugi-i-komornik")?.placeholder).toBe(true);
    vi.stubEnv("PUBLIC_SHOW_UNREVIEWED", "false");
    expect(expertFor("dlugi-i-komornik")).toBeNull();
  });

  it("opublikowany ekspert jest widoczny zawsze; jawne przypisanie ma pierwszeństwo", () => {
    const e = getExpert("ekspert-marka")!;
    saveExpert({ ...e, name: "Anna Przykładowa", title: "rzecznik patentowy", status: "published" });
    vi.stubEnv("PUBLIC_SHOW_UNREVIEWED", "false");
    expect(expertFor("ochrona-marki")?.expert.name).toBe("Anna Przykładowa");
    expect(expertFor("dlugi-i-komornik", "ekspert-marka")?.placeholder).toBe(false);
  });
});

describe("rozszerzona baza pytań", () => {
  it("pytanie z kolejki redakcyjnej dostało odpowiedź", () => {
    const q = getPublicQuestion("jak-odrzucic-spadek-z-dlugami");
    expect(q?.doc.answer).toContain("6 miesięcy");
  });
});
