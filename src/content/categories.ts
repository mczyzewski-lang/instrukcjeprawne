import type { Category, LeadConfiguration } from "@/lib/types";

export const CATEGORIES: Category[] = [
  { slug: "dlugi-i-komornik", name: "Długi i komornik", description: "Zaległości, wezwania, komornik, wyjście z długów.", illustration: "calculator-debts" },
  { slug: "firma-w-trudnosciach", name: "Firma w trudnościach", description: "Długi firmy, utrata płynności, ratowanie działalności.", illustration: "firm-trouble" },
  { slug: "podatki-przedsiebiorcy", name: "Podatki przedsiębiorcy", description: "Preferencje podatkowe i rozliczenia w działalności.", illustration: "tax-form" },
  { slug: "ochrona-marki", name: "Ochrona marki", description: "Nazwa i logo firmy, znaki towarowe, kopiowanie.", illustration: "shield-brand" },
  { slug: "rozwod-i-rodzina", name: "Rozwód i rodzina", description: "Rozstanie, dzieci, alimenty, podział majątku.", illustration: "family" },
  { slug: "kredyty-i-banki", name: "Kredyty i banki", description: "Raty, koszty kredytu, spory z bankiem.", illustration: "bank-building" },
  { slug: "umowy-i-konsumenci", name: "Umowy i konsumenci", description: "Zakupy, zwroty, reklamacje, umowy.", illustration: "signed-agreement" },
  { slug: "inne-sprawy", name: "Inne sprawy", description: "Pisma z sądu, terminy, gdzie szukać bezpłatnej pomocy.", illustration: "letter-received" },
];

export const categoryBySlug = (slug: string) => CATEGORIES.find((c) => c.slug === slug);

const PARTNER_DISCLOSURE =
  "Rozmowę prowadzi współpracujący z portalem podmiot komercyjny ({partner}). Pierwsza rozmowa jest bezpłatna i do niczego nie zobowiązuje. Dalsza pomoc może być odpłatna – o kosztach dowiesz się przed podjęciem decyzji.";

const disclosure = (partner: string) => PARTNER_DISCLOSURE.replace("{partner}", partner);

/**
 * Mapowanie tematów na współpracujące podmioty.
 * Adresy webhooków NIE są przechowywane tutaj – wskazujemy tylko nazwę zmiennej środowiskowej.
 */
export const LEAD_CONFIGURATIONS: LeadConfiguration[] = [
  {
    topic: "dlugi-osobiste",
    partnerName: "Pravna",
    partnerArea: "upadłość konsumencka i oddłużanie",
    webhookEnv: "LEAD_WEBHOOK_PRAVNA_UPADLOSC",
    visibleDisclosure: disclosure("Pravna"),
    formConfiguration: { askEmail: true, contextLabel: "Długi osobiste" },
  },
  {
    topic: "dlugi-firmowe",
    partnerName: "Pravna",
    partnerArea: "restrukturyzacja firm",
    webhookEnv: "LEAD_WEBHOOK_PRAVNA_RESTRUKTURYZACJA",
    visibleDisclosure: disclosure("Pravna"),
    formConfiguration: { askEmail: true, contextLabel: "Długi firmowe" },
  },
  {
    topic: "znak-towarowy",
    partnerName: "Pravna",
    partnerArea: "znaki towarowe",
    webhookEnv: "LEAD_WEBHOOK_PRAVNA_ZNAKI",
    visibleDisclosure: disclosure("Pravna"),
    formConfiguration: { askEmail: true, contextLabel: "Ochrona marki" },
  },
  {
    topic: "ip-box",
    partnerName: "Pravna",
    partnerArea: "IP BOX",
    webhookEnv: "LEAD_WEBHOOK_PRAVNA_IPBOX",
    visibleDisclosure: disclosure("Pravna"),
    formConfiguration: { askEmail: true, contextLabel: "IP BOX" },
  },
  {
    topic: "rozwod",
    partnerName: "Nowy Etap",
    partnerArea: "mediacje rozwodowe",
    webhookEnv: "LEAD_WEBHOOK_NOWY_ETAP",
    visibleDisclosure: disclosure("Nowy Etap"),
    formConfiguration: { askEmail: true, contextLabel: "Rozwód i mediacja" },
  },
  {
    topic: "koszty-kredytu",
    partnerName: "zespół ds. sankcji kredytu darmowego",
    partnerArea: "analiza umów kredytu konsumenckiego",
    webhookEnv: "LEAD_WEBHOOK_SKD",
    visibleDisclosure: disclosure("współpracujący zespół ds. sankcji kredytu darmowego"),
    formConfiguration: { askEmail: true, contextLabel: "Koszty kredytu" },
  },
];
