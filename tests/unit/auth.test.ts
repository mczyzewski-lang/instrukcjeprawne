import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }) }));
vi.mock("next/navigation", () => ({ redirect: () => { throw new Error("redirect"); } }));

const { createSessionToken, verifySessionToken, checkPassword } = await import("@/lib/auth");

describe("sesja administratora", () => {
  it("weryfikuje poprawny token", () => {
    const t = createSessionToken("Anna");
    expect(verifySessionToken(t)?.name).toBe("Anna");
  });
  it("odrzuca zmieniony token", () => {
    const t = createSessionToken("Anna");
    const [p, s] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ name: "X", exp: Date.now() + 1e9 })).toString("base64url");
    expect(verifySessionToken(`${forged}.${s}`)).toBeNull();
    expect(verifySessionToken(`${p}.zly`)).toBeNull();
  });
  it("odrzuca wygasły token", () => {
    const t = createSessionToken("Anna", Date.now() - 13 * 3600_000);
    expect(verifySessionToken(t)).toBeNull();
  });
  it("sprawdza hasło deweloperskie poza produkcją", () => {
    expect(checkPassword("admin-lokalnie")).toBe(true);
    expect(checkPassword("zle")).toBe(false);
  });
});
