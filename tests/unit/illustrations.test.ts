import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetDbForTests } from "@/lib/db";
import { approvedIllustrations, buildPrompt, generateIllustration, listIllustrations, setIllustrationStatus } from "@/lib/illustration-generator";

const PNG_1PX = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

beforeEach(() => {
  resetDbForTests();
  vi.unstubAllEnvs();
  vi.stubEnv("DATA_DIR", mkdtempSync(path.join(tmpdir(), "ip-ill-")));
});

describe("IllustrationGenerator", () => {
  it("buduje prompt ze wzorca i czynności", () => {
    const p = buildPrompt("signing a document\nwith a pen");
    expect(p).toContain("Show one precise action: signing a document with a pen.");
    expect(p).toContain("no lettering or embedded text");
  });

  it("bez klucza API nie udaje generowania", async () => {
    const r = await generateIllustration("step:x:y", "action", "alt");
    expect(r.ok).toBe(false);
  });

  it("generuje, cache'uje i wymaga zatwierdzenia przed publikacją", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ data: [{ b64_json: PNG_1PX }] }), { status: 200 }));
    const f = fetchMock as unknown as typeof fetch;
    const a = await generateIllustration("step:i:k1", "doing X", "Opis", { fetchImpl: f });
    expect(a.ok && !a.cached).toBe(true);
    const b = await generateIllustration("step:i:k1", "doing X", "Opis", { fetchImpl: f });
    expect(b.ok && b.cached).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body.model).toBe("gpt-image-2");

    expect(approvedIllustrations("step:i:").size).toBe(0); // pending nie jest publiczna
    if (!a.ok) return;
    setIllustrationStatus(a.id, "approved");
    expect(approvedIllustrations("step:i:").get("step:i:k1")?.alt).toBe("Opis");

    const c = await generateIllustration("step:i:k1", "doing X", "Opis", { fetchImpl: f, force: true });
    expect(c.ok && !c.cached).toBe(true);
    if (c.ok) setIllustrationStatus(c.id, "approved");
    const rows = listIllustrations("step:i:k1");
    expect(rows.filter((r) => r.status === "approved")).toHaveLength(1);
    expect(rows.some((r) => r.status === "replaced")).toBe(true);
    expect(rows.every((r) => r.prompt_version && r.model)).toBe(true);
  });

  it("zapisuje błąd API jako failed", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    const r = await generateIllustration("step:i:k2", "x", "y", {
      fetchImpl: (async () => new Response(JSON.stringify({ error: { message: "quota" } }), { status: 429 })) as unknown as typeof fetch,
    });
    expect(r.ok).toBe(false);
    expect(listIllustrations("step:i:k2")[0].status).toBe("failed");
  });
});
