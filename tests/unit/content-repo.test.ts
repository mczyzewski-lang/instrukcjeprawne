import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetDbForTests } from "@/lib/db";
import {
  getInstructionForEdit,
  getPublicInstruction,
  getPublicQuestion,
  publishInstruction,
  saveInstructionDraft,
  unpublishInstruction,
} from "@/lib/repo/content";

beforeEach(() => {
  resetDbForTests();
  vi.unstubAllEnvs();
});

describe("rozdzielenie szkiców i treści zatwierdzonych", () => {
  it("treść „do zatwierdzenia” jest widoczna tylko z flagą i jako niezweryfikowana", () => {
    const v = getPublicInstruction("jak-wyjsc-z-dlugow");
    expect(v?.reviewed).toBe(false);
    vi.stubEnv("PUBLIC_SHOW_UNREVIEWED", "false");
    expect(getPublicInstruction("jak-wyjsc-z-dlugow")).toBeNull();
  });

  it("szkic nigdy nie jest publiczny", () => {
    expect(getPublicQuestion("czy-komornik-moze-zabrac-samochod")).toBeNull();
    expect(getPublicQuestion("jak-odrzucic-spadek-z-dlugami")).toBeNull();
  });

  it("publikacja zapisuje recenzenta i datę; edycja nie zmienia wersji opublikowanej", () => {
    const id = "dlugi-osobiste";
    expect(publishInstruction(id, "Anna Recenzentka").ok).toBe(true);
    vi.stubEnv("PUBLIC_SHOW_UNREVIEWED", "false");
    const pub = getPublicInstruction("jak-wyjsc-z-dlugow");
    expect(pub?.reviewed).toBe(true);
    expect(pub?.doc.legalReviewedBy).toBe("Anna Recenzentka");
    expect(pub?.doc.legalReviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const draft = getInstructionForEdit(id)!.draft;
    expect(saveInstructionDraft(id, { ...draft, title: "Zmieniony tytuł w szkicu" }, "draft").ok).toBe(true);
    expect(getPublicInstruction("jak-wyjsc-z-dlugow")?.doc.title).toBe("Jak wyjść z długów osobistych?");

    unpublishInstruction(id);
    expect(getPublicInstruction("jak-wyjsc-z-dlugow")).toBeNull();
  });

  it("zapis z błędnym drzewem jest odrzucany", () => {
    const draft = getInstructionForEdit("dlugi-osobiste")!.draft;
    const broken = { ...draft, decisionTree: { ...draft.decisionTree, startNodeId: "nie-ma" } };
    const r = saveInstructionDraft("dlugi-osobiste", broken, "draft");
    expect(r.ok).toBe(false);
  });
});
