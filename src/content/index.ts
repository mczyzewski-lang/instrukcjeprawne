import type { Instruction, Question } from "@/lib/types";
import { BACKLOG_QUESTIONS } from "./backlog";
import { dlugiFirmowe } from "./instructions/dlugi-firmowe";
import { dlugiOsobiste } from "./instructions/dlugi-osobiste";
import { ipBox } from "./instructions/ip-box";
import { komornikKonto } from "./instructions/komornik-konto";
import { kosztyKredytu } from "./instructions/koszty-kredytu";
import { ochronaMarki } from "./instructions/ochrona-marki";
import { ratyKredytu } from "./instructions/raty-kredytu";
import { rozwod } from "./instructions/rozwod";
import { nakazZaplaty } from "./instructions/nakaz-zaplaty";
import { upadloscKonsumencka } from "./instructions/upadlosc-konsumencka";
import { kredytChf } from "./instructions/kredyt-chf";
import { alimenty } from "./instructions/alimenty";
import { kontaktyDziecko } from "./instructions/kontakty-dziecko";
import { niezaplaconaFaktura } from "./instructions/niezaplacona-faktura";
import { jdgZDlugami } from "./instructions/jdg-z-dlugami";
import { odpowiedzialnoscZarzadu } from "./instructions/odpowiedzialnosc-zarzadu";
import { spadekZDlugami } from "./instructions/spadek-z-dlugami";
import { naruszenieMarki } from "./instructions/naruszenie-marki";
import { ANSWERED_QUESTIONS } from "./questions";
import { MORE_QUESTIONS } from "./questions-more";

/** Treści startowe – wgrywane do bazy przy pierwszym uruchomieniu. */
export const SEED_INSTRUCTIONS: Instruction[] = [
  dlugiOsobiste,
  dlugiFirmowe,
  ipBox,
  ochronaMarki,
  rozwod,
  kosztyKredytu,
  komornikKonto,
  ratyKredytu,
  nakazZaplaty,
  upadloscKonsumencka,
  kredytChf,
  alimenty,
  kontaktyDziecko,
  niezaplaconaFaktura,
  jdgZDlugami,
  odpowiedzialnoscZarzadu,
  spadekZDlugami,
  naruszenieMarki,
];

/**
 * Poprawki treści startowych po pierwszym wdrożeniu: id instrukcji → numer wersji.
 * Przy starcie aplikacji nieopublikowana i nieedytowana w CMS wersja w bazie zostaje zastąpiona nową.
 * Zwiększ numer, gdy poprawiasz treść instrukcji w src/content.
 */
export const SEED_REVISIONS: Record<string, number> = {
  rozwod: 2,
  "kontakty-dziecko": 2,
  alimenty: 2,
};

/** Kolejność na stronie głównej. */
export const FEATURED_SLUGS = [
  "jak-wyjsc-z-dlugow",
  "jak-wyjsc-z-dlugow-firmowych",
  "jak-placic-5-procent-podatku-jako-programista",
  "jak-ochronic-marke",
  "jak-rozwiesc-sie-bez-konfliktu",
  "jak-sprawdzic-koszty-kredytu",
  "co-zrobic-gdy-komornik-zajal-konto",
  "co-zrobic-gdy-nie-mozesz-splacac-rat-kredytu",
];

const ANSWERED = [...ANSWERED_QUESTIONS, ...MORE_QUESTIONS];
const answeredSlugs = new Set(ANSWERED.map((q) => q.slug));

/** Odpowiedzi + kolejka redakcyjna (bez pytań, na które już odpowiedzieliśmy). */
export const SEED_QUESTIONS: Question[] = [...ANSWERED, ...BACKLOG_QUESTIONS.filter((q) => !answeredSlugs.has(q.slug))];
