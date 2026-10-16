import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetDbForTests } from "@/lib/db";
import { createLead, forwardLead, getLead } from "@/lib/repo/leads";
import { rateLimit } from "@/lib/repo/rate-limit";
import { leadSchema } from "@/lib/schemas";

const base = { name: "Jan", phone: "600 100 200", topic: "dlugi-osobiste", contactConsent: true as const, startedAt: Date.now() - 10_000 };

beforeEach(() => {
  resetDbForTests();
  vi.unstubAllEnvs();
  // żadne zapytanie nie wychodzi do sieci w testach
  vi.stubGlobal("fetch", async () => new Response("ok", { status: 200 }));
});

describe("formularz kontaktu – walidacja", () => {
  it("akceptuje minimalne dane i normalizuje telefon", () => {
    const r = leadSchema.safeParse(base);
    expect(r.success).toBe(true);
    expect(r.success && r.data.phone).toBe("600100200");
  });
  it("odrzuca błędny telefon, e-mail i brak zgody", () => {
    expect(leadSchema.safeParse({ ...base, phone: "123" }).success).toBe(false);
    expect(leadSchema.safeParse({ ...base, email: "nie-email" }).success).toBe(false);
    expect(leadSchema.safeParse({ ...base, contactConsent: false }).success).toBe(false);
  });
  it("wykrywa wypełnioną pułapkę antyspamową", () => {
    expect(leadSchema.safeParse({ ...base, website: "spam" }).success).toBe(false);
  });
});

describe("kierowanie zgłoszeń", () => {
  it("bez webhooka zapisuje zgłoszenie ze statusem not_configured", async () => {
    const r = await createLead(leadSchema.parse(base), {});
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.forwarded).toBe(false);
      expect(getLead(r.id)?.status).toBe("not_configured");
      expect(getLead(r.id)?.partner).toBe("Pravna");
    }
  });

  it("przekazuje do właściwego partnera z podpisem HMAC", async () => {
    vi.stubEnv("LEAD_WEBHOOK_NOWY_ETAP", "https://crm.example.test/hook");
    vi.stubEnv("LEAD_WEBHOOK_SECRET", "sekret");
    const r = await createLead(leadSchema.parse({ ...base, topic: "rozwod" }), {});
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.forwarded).toBe(true);
    // ponowne przekazanie z mockiem, który zapisuje wywołania
    const calls: { url: string; init: RequestInit }[] = [];
    const fake = (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response("ok", { status: 200 });
    }) as unknown as typeof fetch;
    const res = await forwardLead(r.id, fake);
    expect(res.status).toBe("forwarded");
    expect(calls[0].url).toBe("https://crm.example.test/hook");
    const body = String(calls[0].init.body);
    expect(JSON.parse(body).partner).toBe("Nowy Etap");
    const sig = (calls[0].init.headers as Record<string, string>)["x-ip-signature"];
    expect(sig).toBe(`sha256=${createHmac("sha256", "sekret").update(body).digest("hex")}`);
    expect(getLead(r.id)?.status).toBe("forwarded");
  });

  it("zapisuje błąd, gdy partner odpowiada błędem", async () => {
    vi.stubEnv("LEAD_WEBHOOK_SKD", "https://crm.example.test/skd");
    const r = await createLead(leadSchema.parse({ ...base, topic: "koszty-kredytu" }), {});
    if (!r.ok) throw new Error();
    const res = await forwardLead(r.id, (async () => new Response("x", { status: 500 })) as unknown as typeof fetch);
    expect(res.status).toBe("failed");
    expect(getLead(r.id)?.last_error).toContain("500");
  });

  it("odrzuca webhook http w produkcji i nieznany temat", async () => {
    const r = await createLead(leadSchema.parse({ ...base, topic: "nie-ma" }), {});
    expect(r.ok).toBe(false);
  });
});

describe("limit zgłoszeń", () => {
  it("blokuje po przekroczeniu limitu", () => {
    for (let i = 0; i < 3; i++) expect(rateLimit("ip-1", 3, 60)).toBe(true);
    expect(rateLimit("ip-1", 3, 60)).toBe(false);
    expect(rateLimit("ip-2", 3, 60)).toBe(true);
  });
});
