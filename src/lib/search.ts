/**
 * Wyszukiwarka problemów – działa w przeglądarce i na serwerze na tym samym indeksie.
 * Normalizuje polskie znaki, rozumie potoczne słowa (synonimy) i toleruje odmiany (prefiksy).
 */

export interface SearchDoc {
  type: "instruction" | "question" | "path";
  title: string;
  url: string;
  /** krótki opis pod tytułem */
  snippet: string;
  /** dodatkowy tekst do przeszukania */
  body: string;
  category?: string;
}

export interface SearchHit extends SearchDoc {
  score: number;
}

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9%\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOP = new Set(["i", "a", "w", "z", "na", "do", "o", "sie", "jak", "co", "czy", "nie", "mam", "mi", "mnie", "moj", "moje", "moja", "jest", "to", "po", "od", "za", "ze", "dalej", "wiem", "juz", "jestem", "mozna", "gdy", "kiedy"]);

/** Słowa potoczne → słowa obecne w treściach. */
const SYNONYMS: Record<string, string[]> = {
  dlug: ["dlugi", "zadluzenie", "zaleglosci", "splata"],
  dlugi: ["dlug", "zadluzenie", "upadlosc", "zaleglosci"],
  komornik: ["egzekucja", "zajecie", "komornika"],
  zajal: ["zajecie", "komornik", "egzekucja"],
  konto: ["rachunek", "konta"],
  bankructwo: ["upadlosc"],
  oddluzanie: ["upadlosc", "uklad", "dlugi"],
  raty: ["rata", "kredyt", "splata"],
  rata: ["raty", "kredyt"],
  kredyt: ["kredytu", "bank", "pozyczka"],
  chwilowka: ["pozyczka", "kredyt"],
  pozyczka: ["kredyt", "chwilowka"],
  firma: ["firmy", "dzialalnosc", "przedsiebiorca", "spolka"],
  biznes: ["firma", "dzialalnosc"],
  jdg: ["dzialalnosc", "firma", "przedsiebiorca"],
  zus: ["skladki", "zaleglosci", "firma"],
  podatek: ["podatku", "pit", "ip", "box", "opodatkowanie"],
  programista: ["programisty", "ip", "box", "kod", "oprogramowanie"],
  it: ["programista", "ip", "box"],
  marka: ["znak", "towarowy", "nazwa", "logo"],
  logo: ["znak", "marka"],
  nazwa: ["znak", "marka", "nazwe"],
  zastrzec: ["znak", "towarowy", "ochrona"],
  rozwod: ["rozwodu", "malzenstwo", "mediacja"],
  rozstanie: ["rozwod", "separacja"],
  maz: ["rozwod", "malzonek"],
  zona: ["rozwod", "malzonek"],
  alimenty: ["dzieci", "rozwod"],
  dziecko: ["dzieci", "alimenty", "kontakty"],
  skd: ["sankcja", "kredytu", "darmowego"],
  prowizja: ["koszty", "kredytu"],
  odsetki: ["koszty", "kredytu"],
  nakaz: ["nakazu", "zaplaty", "sprzeciw", "sad"],
  sad: ["sadu", "pozew", "nakaz"],
  pismo: ["nakaz", "wezwanie", "komornik"],
  zwrot: ["odstapienie", "zwrotu"],
  sklep: ["odstapienie", "konsument"],
  darmowa: ["bezplatna", "nieodplatna", "pomoc"],
  prawnik: ["pomoc", "prawna", "porada"],
};

const STEM_LEN = 5;

export function tokenize(q: string): string[] {
  return normalize(q)
    .split(" ")
    .filter((t) => t.length > 1 && !STOP.has(t));
}

function expand(tokens: string[]): { token: string; weight: number }[] {
  const out = new Map<string, number>();
  for (const t of tokens) {
    out.set(t, Math.max(out.get(t) ?? 0, 1));
    for (const s of SYNONYMS[t] ?? SYNONYMS[t.slice(0, STEM_LEN)] ?? []) out.set(s, Math.max(out.get(s) ?? 0, 0.5));
  }
  return [...out.entries()].map(([token, weight]) => ({ token, weight }));
}

function matches(words: string[], token: string): boolean {
  const stem = token.length > STEM_LEN ? token.slice(0, STEM_LEN) : token;
  return words.some((w) => w === token || (stem.length >= 3 && w.startsWith(stem)) || (w.length >= 4 && token.startsWith(w)));
}

export interface PreparedDoc extends SearchDoc {
  _title: string[];
  _body: string[];
}

export function prepare(docs: SearchDoc[]): PreparedDoc[] {
  return docs.map((d) => ({ ...d, _title: normalize(d.title).split(" "), _body: normalize(`${d.snippet} ${d.body}`).split(" ") }));
}

const TYPE_BOOST: Record<SearchDoc["type"], number> = { instruction: 1.4, question: 1.1, path: 0.9 };

export function search(index: PreparedDoc[], query: string, limit = 8): SearchHit[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];
  const terms = expand(tokens);
  const hits: SearchHit[] = [];
  for (const d of index) {
    let score = 0;
    let originalMatched = 0;
    for (const { token, weight } of terms) {
      const inTitle = matches(d._title, token);
      const inBody = !inTitle && matches(d._body, token);
      if (inTitle) score += 3 * weight;
      else if (inBody) score += 1 * weight;
      if ((inTitle || inBody) && weight === 1) originalMatched++;
    }
    if (score === 0) continue;
    // nagradzamy dopasowanie większości słów z zapytania
    score *= 0.5 + originalMatched / tokens.length;
    score *= TYPE_BOOST[d.type];
    const { _title, _body, ...doc } = d;
    void _title;
    void _body;
    hits.push({ ...doc, score });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}
