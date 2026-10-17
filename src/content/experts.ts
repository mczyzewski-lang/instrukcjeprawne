import type { Expert } from "@/lib/types";

/**
 * Eksperci nadzorujący merytorycznie działy. Dane startowe to SZKIELET do uzupełnienia w panelu
 * (/admin/eksperci): prawdziwe imię i nazwisko, tytuł, opis i zdjęcie. Nie publikujemy fikcyjnych osób –
 * dopóki status to „draft”, sekcja eksperta pokazuje się wyłącznie w trybie podglądu treści roboczych
 * z wyraźnym oznaczeniem „do uzupełnienia”.
 */
const draft = (e: Omit<Expert, "status" | "photoFile">): Expert => ({ ...e, status: "draft", photoFile: null });

export const SEED_EXPERTS: Expert[] = [
  draft({
    id: "ekspert-dlugi",
    name: "Ekspert ds. długów i upadłości",
    title: "Tytuł zawodowy – do uzupełnienia",
    role: "Nadzór merytoryczny: długi, komornik, kredyty",
    bio: "Krótki opis doświadczenia eksperta – do uzupełnienia w panelu.",
    categories: ["dlugi-i-komornik", "kredyty-i-banki"],
    affiliation: "",
  }),
  draft({
    id: "ekspert-firma",
    name: "Ekspert ds. restrukturyzacji",
    title: "Tytuł zawodowy – do uzupełnienia",
    role: "Nadzór merytoryczny: firma w trudnościach",
    bio: "Krótki opis doświadczenia eksperta – do uzupełnienia w panelu.",
    categories: ["firma-w-trudnosciach"],
    affiliation: "",
  }),
  draft({
    id: "ekspert-podatki",
    name: "Ekspert ds. podatków",
    title: "Tytuł zawodowy – do uzupełnienia",
    role: "Nadzór merytoryczny: podatki przedsiębiorcy",
    bio: "Krótki opis doświadczenia eksperta – do uzupełnienia w panelu.",
    categories: ["podatki-przedsiebiorcy"],
    affiliation: "",
  }),
  draft({
    id: "ekspert-marka",
    name: "Ekspert ds. ochrony marki",
    title: "Tytuł zawodowy – do uzupełnienia",
    role: "Nadzór merytoryczny: ochrona marki",
    bio: "Krótki opis doświadczenia eksperta – do uzupełnienia w panelu.",
    categories: ["ochrona-marki"],
    affiliation: "",
  }),
  draft({
    id: "ekspert-rodzina",
    name: "Ekspert ds. rodziny i mediacji",
    title: "Tytuł zawodowy – do uzupełnienia",
    role: "Nadzór merytoryczny: rozwód i rodzina",
    bio: "Krótki opis doświadczenia eksperta – do uzupełnienia w panelu.",
    categories: ["rozwod-i-rodzina"],
    affiliation: "",
  }),
  draft({
    id: "ekspert-konsument",
    name: "Ekspert ds. praw konsumenta",
    title: "Tytuł zawodowy – do uzupełnienia",
    role: "Nadzór merytoryczny: umowy, konsumenci, inne sprawy",
    bio: "Krótki opis doświadczenia eksperta – do uzupełnienia w panelu.",
    categories: ["umowy-i-konsumenci", "inne-sprawy"],
    affiliation: "",
  }),
];
