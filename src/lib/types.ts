/**
 * Model treści InstrukcjePrawne.pl.
 *
 * Jedna instrukcja = jeden problem użytkownika („Jak wyjść z długów?”),
 * nigdy usługa kancelarii. Wszystkie instrukcje składają się z tych samych
 * bloków: pytania orientacyjne → mapa dróg (drzewo decyzji) → kroki →
 * checklista → ostrzeżenia → pomoc → źródła.
 */

export type EditorialStatus = "draft" | "review" | "published" | "archived";

export const EDITORIAL_STATUS_LABEL: Record<EditorialStatus, string> = {
  draft: "Szkic",
  review: "Do zatwierdzenia",
  published: "Opublikowana",
  archived: "Archiwum",
};

/** Poziom potwierdzenia informacji w źródle. */
export type SourceConfidence =
  /** potwierdzone w źródle urzędowym / tekście aktu */
  | "verified"
  /** potwierdzone częściowo lub w źródle pomocniczym (np. strona sądu, poradnik) */
  | "partial"
  /** nie udało się wiarygodnie potwierdzić – wymaga sprawdzenia przez redakcję */
  | "unverified";

export interface SourceReference {
  id: string;
  title: string;
  publisher: string;
  url: string;
  /** data publikacji lub aktualizacji dokumentu, jeżeli jest znana (YYYY-MM-DD lub YYYY) */
  publishedOrUpdated?: string;
  /** data weryfikacji przez redakcję / research (YYYY-MM-DD) */
  verifiedAt: string;
  confidence: SourceConfidence;
  /** co dokładnie potwierdza to źródło */
  supports?: string;
  /** np. „projekt ustawy – nie jest obowiązującym prawem” */
  note?: string;
}

export type IllustrationId = string;

export interface Step {
  id: string;
  number: number;
  title: string;
  explanation: string;
  illustration: IllustrationId;
  /** tekst alternatywny – jeśli brak, używany jest opis z biblioteki ilustracji */
  illustrationAlt?: string;
  checklist?: string[];
  warning?: string;
  sourceReferences?: string[];
}

export type PathKind = "self" | "negotiation" | "formal" | "court" | "free-help" | "check";

export const PATH_KIND_LABEL: Record<PathKind, string> = {
  self: "Samodzielnie",
  negotiation: "Porozumienie",
  formal: "Procedura formalna",
  court: "Sąd",
  "free-help": "Bezpłatna pomoc",
  check: "Sprawdzenie",
};

export interface ChecklistItem {
  id: string;
  label: string;
  hint?: string;
}

export interface Path {
  id: string;
  instructionId: string;
  name: string;
  /** jedno zdanie – co to jest, ludzkim językiem */
  summary: string;
  kind: PathKind;
  illustration: IllustrationId;
  whenApplicable: string[];
  whenNotApplicable: string[];
  benefits: string[];
  risks: string[];
  costs: string[];
  requirements: string[];
  firstStep: string;
  steps: Step[];
  documents: ChecklistItem[];
  expertHelpAvailable: boolean;
  sourceReferences?: string[];
}

export interface SituationQuestion {
  id: string;
  question: string;
  /** co oznacza odpowiedź „tak” */
  ifYes: string;
  /** co oznacza odpowiedź „nie” */
  ifNo: string;
}

export interface Warning {
  id: string;
  title: string;
  body: string;
  severity: "urgent" | "important";
  sourceReferences?: string[];
}

export interface FreeHelpResource {
  name: string;
  description: string;
  url?: string;
  phone?: string;
}

export interface UrgentNotice {
  title: string;
  items: string[];
}

/* ---------- Drzewo decyzji ---------- */

export interface DecisionOption {
  id: string;
  label: string;
  /** kolejne pytanie */
  nextNodeId?: string;
  /** wyniki zbierane po drodze (mogą być wybrane z wielu odpowiedzi) */
  outcomeIds?: string[];
  /** odpowiedź typu „nie wiem” – wynik będzie oznaczony jako niepełny */
  uncertain?: boolean;
}

export interface DecisionNode {
  id: string;
  question: string;
  help?: string;
  options: DecisionOption[];
}

export interface DecisionOutcome {
  id: string;
  title: string;
  description: string;
  /** ścieżki instrukcji, do których prowadzi wynik */
  pathIds: string[];
  /** odesłanie do innej instrukcji (np. gdy problem dotyczy firmy, a nie osoby) */
  instructionSlug?: string;
  /** wyróżnienie np. pilnego działania */
  urgent?: boolean;
  /** kolejność prezentacji – niższa = wyżej */
  priority?: number;
}

export interface DecisionTree {
  id: string;
  title: string;
  intro: string;
  startNodeId: string;
  nodes: DecisionNode[];
  outcomes: DecisionOutcome[];
}

/* ---------- Instrukcja ---------- */

export type CategorySlug =
  | "dlugi-i-komornik"
  | "firma-w-trudnosciach"
  | "podatki-przedsiebiorcy"
  | "ochrona-marki"
  | "rozwod-i-rodzina"
  | "kredyty-i-banki"
  | "umowy-i-konsumenci"
  | "inne-sprawy";

export interface Instruction {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: CategorySlug;
  shortDescription: string;
  /** minuty */
  estimatedReadingTime: number;
  illustration: IllustrationId;
  updatedAt: string;
  /** data merytorycznej weryfikacji prawnej przez człowieka – null dopóki nikt nie zatwierdził */
  legalReviewedAt: string | null;
  legalReviewedBy?: string | null;
  /** data researchu źródeł (stan prawny na dzień) */
  researchedAt: string;
  editorialStatus: EditorialStatus;
  /** treść przygotowana z pomocą AI – wymaga zatwierdzenia przez człowieka */
  aiAssisted: boolean;
  urgent?: UrgentNotice;
  situationQuestions: SituationQuestion[];
  decisionTree: DecisionTree;
  paths: Path[];
  warnings: Warning[];
  freeHelp: FreeHelpResource[];
  sourceReferences: SourceReference[];
  /** opis stanu prawnego, w tym planowanych zmian, które NIE obowiązują */
  legalStatusNote: string;
  /** elementy, których nie udało się wiarygodnie potwierdzić */
  pendingVerification: string[];
  relatedQuestions: string[];
  relatedInstructions: string[];
  /** klucz konfiguracji leadów (LeadConfiguration.topic) lub null, gdy brak współpracującego podmiotu */
  leadTopic: string | null;
  /** ekspert nadzorujący merytorycznie (Expert.id); brak = przypisanie według kategorii */
  expertId?: string | null;
}

/* ---------- Eksperci ---------- */

/**
 * Osoba nadzorująca merytorycznie dział tematyczny. Pokazywana dyskretnie w instrukcji
 * (nie w hero, bez przycisków sprzedażowych), żeby czytelnik wiedział, kto odpowiada za treść.
 */
export interface Expert {
  id: string;
  /** imię i nazwisko */
  name: string;
  /** tytuł zawodowy, np. „radca prawny”, „doradca restrukturyzacyjny” */
  title: string;
  /** rola w serwisie, np. „Nadzór merytoryczny: długi i upadłość” */
  role: string;
  /** krótki opis doświadczenia (2–3 zdania) */
  bio: string;
  /** kategorie, które nadzoruje */
  categories: CategorySlug[];
  /** ujawnienie powiązań, np. „Współpracuje z Pravna (podmiot komercyjny)” */
  affiliation?: string;
  /** adres e-mail do przycisku „Wyślij wiadomość e-mail” (opcjonalny) */
  email?: string;
  /** nazwa pliku zdjęcia w magazynie (ustawiana przez panel) */
  photoFile?: string | null;
  /** published = dane prawdziwe i zatwierdzone; draft = do uzupełnienia */
  status: "draft" | "published";
}

export interface FoundersVideo {
  title: string;
  /** URL pliku wideo (mp4) albo strony z filmem */
  url: string;
  poster?: string;
  transcript?: string;
}

/* ---------- Pytania ---------- */

export type VideoPlatform = "own" | "instagram" | "tiktok" | "youtube";

export interface RelatedVideo {
  platform: VideoPlatform;
  url: string;
  title: string;
  transcript?: string;
  publishedAt?: string;
  instructionSlug?: string;
}

export interface Question {
  id: string;
  slug: string;
  title: string;
  category: CategorySlug;
  /** krótka odpowiedź – 1–3 zdania */
  answer: string;
  /** konkretne działania */
  actions: string[];
  /** dłuższe wyjaśnienie (opcjonalne) */
  explanation?: string;
  sourceReferences: SourceReference[];
  relatedInstruction: string | null;
  /** id ścieżki w powiązanej instrukcji */
  relatedPath?: string | null;
  relatedQuestions: string[];
  relatedVideo?: RelatedVideo | null;
  status: EditorialStatus;
  aiAssisted: boolean;
  legalReviewedAt: string | null;
  updatedAt: string;
  /** notatka redakcyjna (np. dlaczego pytanie jest w backlogu) */
  editorialNote?: string;
  /** priorytet w kolejce redakcyjnej */
  priority?: "high" | "medium" | "low";
}

/* ---------- Leady ---------- */

export interface LeadConfiguration {
  topic: string;
  /** nazwa współpracującego podmiotu */
  partnerName: string;
  /** opis obszaru, np. „upadłość konsumencka” */
  partnerArea: string;
  /** nazwa zmiennej środowiskowej z adresem webhooka – adresów nie trzymamy w bazie ani w kodzie */
  webhookEnv: string;
  visibleDisclosure: string;
  formConfiguration: {
    askEmail: boolean;
    contextLabel: string;
  };
}

/* ---------- Kategorie ---------- */

export interface Category {
  slug: CategorySlug;
  name: string;
  description: string;
  illustration: IllustrationId;
}
