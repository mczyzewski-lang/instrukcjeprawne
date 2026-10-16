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
import { ANSWERED_QUESTIONS } from "./questions";

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
];

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

export const SEED_QUESTIONS: Question[] = [...ANSWERED_QUESTIONS, ...BACKLOG_QUESTIONS];
