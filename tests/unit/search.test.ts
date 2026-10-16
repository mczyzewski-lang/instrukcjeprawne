import { describe, expect, it } from "vitest";
import { normalize, prepare, search } from "@/lib/search";

const index = prepare([
  { type: "instruction", title: "Jak wyjść z długów osobistych?", url: "/a", snippet: "Upadłość, układ", body: "komornik nakaz" },
  { type: "instruction", title: "Jak ochronić nazwę i logo firmy przed skopiowaniem?", url: "/b", snippet: "Znak towarowy", body: "UPRP" },
  { type: "question", title: "Czy komornik może zająć całe konto?", url: "/c", snippet: "Kwota wolna", body: "" },
  { type: "instruction", title: "Jak płacić 5% podatku jako programista?", url: "/d", snippet: "IP BOX", body: "" },
]);

describe("wyszukiwarka", () => {
  it("normalizuje polskie znaki", () => {
    expect(normalize("Długi, Żółć!")).toBe("dlugi zolc");
  });
  it("rozumie zapytanie potoczne", () => {
    expect(search(index, "mam długi i nie wiem co dalej")[0].url).toBe("/a");
  });
  it("znajduje po odmianie i synonimie", () => {
    expect(search(index, "komornik zajął konto")[0].url).toBe("/c");
    expect(search(index, "zastrzec logo")[0].url).toBe("/b");
    expect(search(index, "podatek dla programisty")[0].url).toBe("/d");
  });
  it("zwraca pustą listę dla pustego zapytania", () => {
    expect(search(index, "  ")).toEqual([]);
  });
});
