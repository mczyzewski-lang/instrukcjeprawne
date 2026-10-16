/**
 * Biblioteka własnych ilustracji instruktażowych (SVG).
 *
 * Zasady:
 * - kontur o stałej grubości (2.5 px w viewBox 160×120), bez cieniowania i gradientów,
 * - kolor tuszu = granat (INK), drobny akcent = złoty (ACCENT), tło = biel (PAPER),
 * - brak tekstu w obrazach – tekst instrukcji zawsze pozostaje HTML-em,
 * - każda ilustracja pokazuje jedną czynność i ma opis alternatywny.
 *
 * Ilustracje są zapisane jako znaczniki SVG z tokenami {{INK}}, {{ACCENT}}, {{PAPER}},
 * dzięki czemu ten sam rysunek renderuje się w przeglądarce (currentColor) i w PDF.
 */

export interface IllustrationDef {
  id: string;
  alt: string;
  /** czynność – używana też jako [ACTION] w promptach generatora AI */
  action: string;
  body: string;
}

export const VIEWBOX = "0 0 160 120";

/* ---------- prymitywy ---------- */

const person = (cx: number, top: number, accent = false) =>
  `<circle cx="${cx}" cy="${top + 8}" r="7" fill="{{PAPER}}"/>` +
  `<path d="M${cx - 12} ${top + 48} V${top + 30} a12 12 0 0 1 24 0 V${top + 48}" fill="${accent ? "{{ACCENT}}" : "{{PAPER}}"}" ${accent ? 'stroke="{{INK}}"' : ""}/>`;

const doc = (x: number, y: number, w: number, h: number, lines = 3) => {
  let s = `<path d="M${x} ${y} H${x + w - 10} L${x + w} ${y + 10} V${y + h} H${x} Z" fill="{{PAPER}}"/>`;
  s += `<path d="M${x + w - 10} ${y} V${y + 10} H${x + w}"/>`;
  for (let i = 0; i < lines; i++) {
    const ly = y + 16 + i * 9;
    if (ly > y + h - 6) break;
    const lw = i === lines - 1 ? (w - 16) * 0.6 : w - 16;
    s += `<path d="M${x + 8} ${ly} H${x + 8 + lw}"/>`;
  }
  return s;
};

const ground = `<path d="M14 108 H146" stroke-width="1.5" opacity="0.35"/>`;

const tick = (x: number, y: number, s = 1) =>
  `<path d="M${x} ${y} l${4 * s} ${4 * s} l${8 * s} -${9 * s}" stroke="{{ACCENT}}" stroke-width="3"/>`;

/* ---------- ilustracje ---------- */

const defs: IllustrationDef[] = [
  {
    id: "documents-collect",
    alt: "Teczka, do której wkładane są kolejne dokumenty",
    action: "putting several paper documents into one folder",
    body:
      ground +
      `<path d="M40 104 V54 H66 L72 62 H120 V104 Z" fill="{{PAPER}}"/>` +
      doc(58, 22, 34, 44, 3) +
      doc(78, 30, 34, 44, 3) +
      `<path d="M40 104 L48 70 H128 L120 104 Z" fill="{{PAPER}}"/>` +
      `<path d="M120 18 v12 M114 24 h12" stroke="{{ACCENT}}"/>`,
  },
  {
    id: "calculator-debts",
    alt: "Lista zobowiązań i kalkulator obok niej",
    action: "adding up debts from a list using a calculator",
    body:
      ground +
      doc(26, 20, 56, 78, 6) +
      `<rect x="92" y="40" width="44" height="60" rx="4" fill="{{PAPER}}"/>` +
      `<rect x="100" y="48" width="28" height="12" rx="1"/>` +
      `<path d="M102 70 h4 M112 70 h4 M122 70 h4 M102 80 h4 M112 80 h4 M122 80 h4 M102 90 h4 M112 90 h4"/>` +
      `<path d="M120 90 h6" stroke="{{ACCENT}}" stroke-width="3"/>` +
      `<path d="M34 92 H58" stroke="{{ACCENT}}" stroke-width="3"/>`,
  },
  {
    id: "letter-received",
    alt: "Otwarta koperta z pismem urzędowym i znakiem uwagi",
    action: "opening an official letter that arrived by post",
    body:
      ground +
      `<path d="M36 60 L80 30 L124 60 V104 H36 Z" fill="{{PAPER}}"/>` +
      doc(52, 22, 56, 56, 4) +
      `<path d="M36 60 L80 88 L124 60" fill="{{PAPER}}"/>` +
      `<path d="M36 104 L68 80 M124 104 L92 80"/>` +
      `<circle cx="126" cy="26" r="11" fill="{{PAPER}}" stroke="{{ACCENT}}"/>` +
      `<path d="M126 20 v7" stroke="{{ACCENT}}" stroke-width="3"/><circle cx="126" cy="31.5" r="0.8" stroke="{{ACCENT}}" stroke-width="2.5"/>`,
  },
  {
    id: "calendar-deadline",
    alt: "Kalendarz z zaznaczonym terminem i zegar",
    action: "marking a deadline on a calendar",
    body:
      ground +
      `<rect x="28" y="28" width="72" height="72" rx="4" fill="{{PAPER}}"/>` +
      `<path d="M28 44 H100 M44 22 v12 M84 22 v12"/>` +
      `<path d="M40 58 h6 M54 58 h6 M68 58 h6 M82 58 h6 M40 72 h6 M54 72 h6 M82 72 h6 M40 86 h6 M54 86 h6 M68 86 h6"/>` +
      `<circle cx="71" cy="72" r="8" stroke="{{ACCENT}}" stroke-width="3"/>` +
      `<circle cx="120" cy="80" r="20" fill="{{PAPER}}"/>` +
      `<path d="M120 68 V80 L129 86"/>`,
  },
  {
    id: "phone-call",
    alt: "Osoba rozmawiająca przez telefon",
    action: "a person calling someone on the phone to discuss repayment",
    body:
      ground +
      person(58, 50) +
      `<rect x="66" y="52" width="10" height="18" rx="2" fill="{{PAPER}}"/>` +
            `<path d="M92 26 H136 a6 6 0 0 1 6 6 V52 a6 6 0 0 1 -6 6 H108 L98 66 V58 H92 a6 6 0 0 1 -6 -6 V32 a6 6 0 0 1 6 -6 Z" fill="{{PAPER}}"/>` +
      `<path d="M98 38 H130 M98 47 H118"/>` +
      `<path d="M120 47 h10" stroke="{{ACCENT}}" stroke-width="3"/>`,
  },
  {
    id: "negotiation-table",
    alt: "Dwie osoby przy stole z dokumentem pomiędzy nimi",
    action: "two people at a table discussing one document",
    body:
      person(38, 42) +
      person(122, 42) +
      `<path d="M18 90 H142 M30 90 V108 M130 90 V108"/>` +
      `<path d="M64 88 L70 66 H96 L90 88 Z" fill="{{PAPER}}"/>` +
      `<path d="M74 74 H90 M73 80 H86"/>` +
      `<path d="M58 58 q6 -10 14 -6 M102 58 q-6 -10 -14 -6" stroke="{{ACCENT}}"/>`,
  },
  {
    id: "signed-agreement",
    alt: "Dokument z podpisem i długopis",
    action: "signing a written agreement with a pen",
    body:
      ground +
      doc(40, 16, 64, 86, 5) +
      `<path d="M50 86 c6 -8 10 4 16 -2 s8 -6 12 0" stroke="{{ACCENT}}"/>` +
      `<path d="M50 92 H92" stroke-width="1.5"/>` +
      `<path d="M112 98 L134 40 L142 43 L120 101 L111 106 Z" fill="{{PAPER}}"/>` +
      `<path d="M131 48 L139 51"/>`,
  },
  {
    id: "magnifier-contract",
    alt: "Umowa oglądana przez lupę",
    action: "checking a contract carefully with a magnifying glass",
    body:
      ground +
      doc(30, 16, 64, 88, 7) +
      `<circle cx="96" cy="64" r="22" fill="{{PAPER}}"/>` +
      `<path d="M86 60 H106 M86 68 H100"/>` +
      `<path d="M100 68 h6" stroke="{{ACCENT}}" stroke-width="3"/>` +
      `<path d="M112 80 L132 100" stroke-width="5"/>`,
  },
  {
    id: "bank-building",
    alt: "Budynek banku z kolumnami i moneta",
    action: "a bank building",
    body:
      `<path d="M22 108 H138"/>` +
      `<path d="M28 100 H132 M32 100 V94 H128 V100"/>` +
      `<path d="M40 94 V54 M58 94 V54 M76 94 V54 M94 94 V54 M112 94 V54"/>` +
      `<path d="M30 54 H130 L80 22 Z" fill="{{PAPER}}"/>` +
      `<circle cx="80" cy="42" r="6" stroke="{{ACCENT}}"/>`,
  },
  {
    id: "court-building",
    alt: "Budynek sądu z wagą",
    action: "a courthouse with scales of justice",
    body:
      `<path d="M22 108 H138"/>` +
      `<path d="M26 100 H134 M30 100 V94 H130 V100"/>` +
      `<path d="M38 94 V56 M54 94 V56 M106 94 V56 M122 94 V56"/>` +
      `<path d="M28 56 H132 L80 24 Z" fill="{{PAPER}}"/>` +
      `<path d="M80 62 V90 M66 66 H94 M66 66 l-6 12 h12 Z M94 66 l-6 12 h12 Z M72 90 H88" stroke="{{ACCENT}}"/>`,
  },
  {
    id: "laptop-form",
    alt: "Laptop z formularzem wypełnianym online",
    action: "filling in an official online form on a laptop",
    body:
      ground +
      `<rect x="34" y="26" width="92" height="60" rx="4" fill="{{PAPER}}"/>` +
      `<path d="M22 96 H138 L130 86 H30 Z" fill="{{PAPER}}"/>` +
      `<rect x="46" y="38" width="44" height="8" rx="1"/><rect x="46" y="52" width="68" height="8" rx="1"/>` +
      `<rect x="46" y="66" width="22" height="9" rx="2" stroke="{{ACCENT}}"/>` +
      tick(98, 40, 0.9),
  },
  {
    id: "budget-coins",
    alt: "Słupki monet i wykres przychodów oraz wydatków",
    action: "comparing monthly income with monthly expenses",
    body:
      ground +
      `<ellipse cx="44" cy="100" rx="16" ry="5" fill="{{PAPER}}"/><path d="M28 100 v-8 M60 100 v-8"/><ellipse cx="44" cy="92" rx="16" ry="5" fill="{{PAPER}}"/><path d="M28 92 v-8 M60 92 v-8"/><ellipse cx="44" cy="84" rx="16" ry="5" fill="{{PAPER}}"/>` +
      `<path d="M84 104 V70 H98 V104 M106 104 V44 H120 V104" fill="{{PAPER}}"/>` +
      `<path d="M128 104 V58 H142 V104" stroke="{{ACCENT}}"/>` +
      `<path d="M80 30 L100 22 L116 30 L140 18"/>`,
  },
  {
    id: "house-key",
    alt: "Dom i klucz",
    action: "a house and its key, representing property",
    body:
      ground +
      `<path d="M30 108 V62 L70 32 L110 62 V108" fill="{{PAPER}}"/>` +
      `<path d="M22 68 L70 30 L118 68"/>` +
      `<rect x="58" y="78" width="24" height="30"/>` +
      `<circle cx="126" cy="44" r="9" stroke="{{ACCENT}}"/><path d="M126 53 V82 M126 70 h7 M126 78 h5" stroke="{{ACCENT}}"/>`,
  },
  {
    id: "shield-brand",
    alt: "Tarcza chroniąca znak firmy",
    action: "a shield protecting a simple company logo",
    body:
      ground +
      `<path d="M80 14 L124 28 V58 C124 82 106 98 80 106 C54 98 36 82 36 58 V28 Z" fill="{{PAPER}}"/>` +
      `<circle cx="80" cy="58" r="16" stroke="{{ACCENT}}"/>` +
      `<path d="M72 58 L80 48 L88 58 L80 68 Z"/>`,
  },
  {
    id: "search-name",
    alt: "Lupa przeszukująca listę nazw – jedna jest wolna, jedna zajęta",
    action: "searching a database list to check whether a name is already registered",
    body:
      ground +
      `<rect x="22" y="18" width="76" height="86" rx="4" fill="{{PAPER}}"/>` +
      `<path d="M34 34 H70 M34 50 H76 M34 66 H66 M34 82 H72"/>` +
      `<path d="M80 30 l8 8 M88 30 l-8 8"/>` +
      tick(80, 64) +
      `<circle cx="112" cy="58" r="18" fill="{{PAPER}}"/>` +
      `<path d="M125 71 L142 88" stroke-width="5"/>`,
  },
  {
    id: "map-territory",
    alt: "Mapa z zaznaczonym obszarem ochrony",
    action: "choosing a territory on a map",
    body:
      ground +
      `<path d="M24 32 L56 22 L104 32 L136 22 V96 L104 106 L56 96 L24 106 Z" fill="{{PAPER}}"/>` +
      `<path d="M56 22 V96 M104 32 V106"/>` +
      `<path d="M80 40 c-10 0 -16 7 -16 15 c0 12 16 26 16 26 s16 -14 16 -26 c0 -8 -6 -15 -16 -15 Z" fill="{{PAPER}}" stroke="{{ACCENT}}"/>` +
      `<circle cx="80" cy="55" r="5" stroke="{{ACCENT}}"/>`,
  },
  {
    id: "classes-grid",
    alt: "Siatka kategorii, z których kilka jest zaznaczonych",
    action: "selecting a few categories from a grid of goods and services",
    body:
      ground +
      [0, 1, 2, 3]
        .map((c) => [0, 1, 2].map((r) => `<rect x="${28 + c * 28}" y="${20 + r * 28}" width="20" height="20" rx="2" fill="{{PAPER}}"/>`).join(""))
        .join("") +
      tick(32, 30) +
      tick(88, 58) +
      tick(60, 86),
  },
  {
    id: "family",
    alt: "Dwoje dorosłych i dziecko",
    action: "two parents and a child standing together",
    body:
      ground +
      person(46, 42) +
      person(114, 42) +
      `<circle cx="80" cy="68" r="6" fill="{{PAPER}}"/>` +
      `<path d="M70 104 V88 a10 10 0 0 1 20 0 V104" fill="{{PAPER}}" stroke="{{ACCENT}}"/>` +
      `<path d="M58 84 L70 92 M102 84 L90 92"/>` +
      `<path d="M34 90 V104 M58 90 V104 M102 90 V104 M126 90 V104"/>`,
  },
  {
    id: "mediation",
    alt: "Dwie osoby i mediator przy wspólnym stole",
    action: "two people talking at a round table with a neutral mediator between them",
    body:
      person(34, 40) +
      person(126, 40) +
      `<circle cx="80" cy="28" r="7" fill="{{PAPER}}"/>` +
      `<path d="M68 68 V50 a12 12 0 0 1 24 0 V68" fill="{{PAPER}}" stroke="{{ACCENT}}"/>` +
      `<path d="M14 88 H146 M28 88 V108 M132 88 V108"/>` +
      `<path d="M54 50 h12 M94 50 h12" stroke-width="1.5"/>`,
  },
  {
    id: "two-paths",
    alt: "Rozwidlenie drogi – strzałki w dwóch kierunkach",
    action: "a fork in the road with two arrows showing alternative ways",
    body:
      ground +
      `<path d="M80 108 V66 M80 66 L46 34 M80 66 L114 34"/>` +
      `<path d="M38 46 L44 32 L58 36"/>` +
      `<path d="M102 36 L116 32 L122 46" stroke="{{ACCENT}}"/>` +
      `<path d="M80 66 L114 34" stroke="{{ACCENT}}"/>` +
      `<circle cx="80" cy="66" r="4" fill="{{PAPER}}"/>`,
  },
  {
    id: "code-laptop",
    alt: "Laptop z kodem programu",
    action: "a programmer writing source code on a laptop",
    body:
      ground +
      `<rect x="34" y="24" width="92" height="62" rx="4" fill="{{PAPER}}"/>` +
      `<path d="M22 96 H138 L130 86 H30 Z" fill="{{PAPER}}"/>` +
      `<path d="M62 44 L50 55 L62 66 M98 44 L110 55 L98 66"/>` +
      `<path d="M86 40 L74 70" stroke="{{ACCENT}}"/>`,
  },
  {
    id: "tax-form",
    alt: "Formularz podatkowy ze znakiem procentu",
    action: "filling in an annual tax return form",
    body:
      ground +
      doc(34, 14, 66, 90, 3) +
      `<rect x="42" y="56" width="50" height="10" rx="1"/><rect x="42" y="74" width="50" height="10" rx="1"/>` +
      `<circle cx="120" cy="40" r="5" stroke="{{ACCENT}}"/><circle cx="136" cy="62" r="5" stroke="{{ACCENT}}"/><path d="M140 34 L116 68" stroke="{{ACCENT}}"/>`,
  },
  {
    id: "ledger-records",
    alt: "Zeszyt ewidencji z kolumnami",
    action: "keeping separate records in a ledger with columns",
    body:
      ground +
      `<rect x="26" y="22" width="108" height="80" rx="3" fill="{{PAPER}}"/>` +
      `<path d="M80 22 V102"/>` +
      `<path d="M36 38 H72 M36 50 H72 M36 62 H72 M36 74 H72 M88 38 H124 M88 50 H124 M88 62 H124"/>` +
      `<path d="M58 38 V74 M110 38 V62" stroke-width="1.5"/>` +
      `<path d="M88 74 H124" stroke="{{ACCENT}}" stroke-width="3"/>`,
  },
  {
    id: "account-blocked",
    alt: "Karta płatnicza i kłódka – zablokowane konto",
    action: "a bank card next to a closed padlock, meaning a frozen account",
    body:
      ground +
      `<rect x="20" y="34" width="84" height="54" rx="6" fill="{{PAPER}}"/>` +
      `<path d="M20 50 H104 M30 74 H56"/>` +
      `<rect x="96" y="62" width="40" height="34" rx="4" fill="{{PAPER}}" stroke="{{ACCENT}}"/>` +
      `<path d="M104 62 V52 a12 12 0 0 1 24 0 V62" stroke="{{ACCENT}}"/>` +
      `<path d="M116 74 V84" stroke="{{ACCENT}}" stroke-width="3"/>`,
  },
  {
    id: "car",
    alt: "Samochód",
    action: "a simple car",
    body:
      ground +
      `<path d="M22 92 V74 L36 70 L52 50 H104 L120 70 L138 74 V92 Z" fill="{{PAPER}}"/>` +
      `<path d="M58 56 H78 V70 H46 Z M84 56 H100 L112 70 H84 Z"/>` +
      `<circle cx="48" cy="94" r="10" fill="{{PAPER}}"/><circle cx="112" cy="94" r="10" fill="{{PAPER}}"/>` +
      `<path d="M128 80 h8" stroke="{{ACCENT}}" stroke-width="3"/>`,
  },
  {
    id: "help-desk",
    alt: "Doradca przy biurku rozmawia z osobą szukającą pomocy",
    action: "a free legal advice desk where an advisor talks with a visitor",
    body:
      person(42, 40) +
      person(118, 40) +
      `<path d="M74 88 H146 M84 88 V108 M138 88 V108 M18 108 H146"/>` +
      `<path d="M30 88 V108 M54 88 V108 M26 88 H58"/>` +
      `<path d="M66 22 H96 a5 5 0 0 1 5 5 V40 a5 5 0 0 1 -5 5 H78 L70 52 V45 H66 a5 5 0 0 1 -5 -5 V27 a5 5 0 0 1 5 -5 Z" fill="{{PAPER}}"/>` +
      `<path d="M69 31 H92 M69 37 H84"/>`,
  },
  {
    id: "warning-sign",
    alt: "Trójkątny znak ostrzegawczy",
    action: "a triangular warning sign",
    body:
      ground +
      `<path d="M80 18 L136 100 H24 Z" fill="{{PAPER}}"/>` +
      `<path d="M80 48 V74" stroke="{{ACCENT}}" stroke-width="5"/>` +
      `<circle cx="80" cy="86" r="1.5" stroke="{{ACCENT}}" stroke-width="5"/>`,
  },
  {
    id: "checklist",
    alt: "Lista kontrolna z odhaczonymi punktami",
    action: "ticking off items on a checklist on a clipboard",
    body:
      ground +
      `<rect x="40" y="20" width="80" height="86" rx="4" fill="{{PAPER}}"/>` +
      `<rect x="62" y="14" width="36" height="12" rx="3" fill="{{PAPER}}"/>` +
      `<rect x="50" y="38" width="10" height="10" rx="1"/><rect x="50" y="58" width="10" height="10" rx="1"/><rect x="50" y="78" width="10" height="10" rx="1"/>` +
      `<path d="M68 43 H108 M68 63 H104 M68 83 H100"/>` +
      tick(49, 41, 0.9) +
      tick(49, 61, 0.9),
  },
  {
    id: "firm-trouble",
    alt: "Budynek firmy i wykres ze spadkiem",
    action: "a small company building with a falling chart",
    body:
      ground +
      `<path d="M24 108 V54 H76 V108" fill="{{PAPER}}"/>` +
      `<path d="M20 54 L30 40 H70 L80 54"/>` +
      `<rect x="34" y="66" width="12" height="12"/><rect x="54" y="66" width="12" height="12"/><path d="M42 108 V88 H58 V108"/>` +
      `<path d="M92 34 L108 52 L120 44 L140 74" stroke="{{ACCENT}}"/>` +
      `<path d="M132 74 H140 V66" stroke="{{ACCENT}}"/>`,
  },
  {
    id: "firm-recovery",
    alt: "Budynek firmy i wykres, który znów rośnie",
    action: "a small company building with a recovering, rising chart",
    body:
      ground +
      `<path d="M24 108 V54 H76 V108" fill="{{PAPER}}"/>` +
      `<path d="M20 54 L30 40 H70 L80 54"/>` +
      `<rect x="34" y="66" width="12" height="12"/><rect x="54" y="66" width="12" height="12"/><path d="M42 108 V88 H58 V108"/>` +
      `<path d="M92 50 L106 70 L120 58 L140 30" stroke="{{ACCENT}}"/>` +
      `<path d="M132 30 H140 V38" stroke="{{ACCENT}}"/>`,
  },
  {
    id: "hourglass",
    alt: "Klepsydra – upływający czas",
    action: "an hourglass showing that time is running out",
    body:
      ground +
      `<path d="M52 18 H108 M52 104 H108"/>` +
      `<path d="M58 18 C58 46 78 50 78 61 C78 72 58 76 58 104 M102 18 C102 46 82 50 82 61 C82 72 102 76 102 104" fill="{{PAPER}}"/>` +
      `<path d="M66 96 C70 86 90 86 94 96 Z M70 36 H90" stroke="{{ACCENT}}"/>`,
  },
  {
    id: "envelope-send",
    alt: "Koperta wysyłana ze strzałką",
    action: "sending a written letter or statement",
    body:
      ground +
      `<rect x="26" y="38" width="80" height="54" rx="3" fill="{{PAPER}}"/>` +
      `<path d="M26 40 L66 70 L106 40"/>` +
      `<path d="M114 64 H142 M132 54 L142 64 L132 74" stroke="{{ACCENT}}"/>`,
  },
  {
    id: "scales",
    alt: "Waga z dwiema szalami – porównanie zalet i ryzyk",
    action: "weighing pros and cons on a balance scale",
    body:
      `<path d="M50 108 H110 M80 108 V24 M40 34 H120"/>` +
      `<circle cx="80" cy="24" r="4" fill="{{PAPER}}"/>` +
      `<path d="M40 34 L26 66 H54 Z" fill="{{PAPER}}"/>` +
      `<path d="M120 34 L106 66 H134 Z" fill="{{PAPER}}" stroke="{{ACCENT}}"/>` +
      `<path d="M26 66 a14 6 0 0 0 28 0 M106 66 a14 6 0 0 0 28 0"/>`,
  },
  {
    id: "person-question",
    alt: "Osoba zastanawiająca się, co dalej",
    action: "a person thinking about what to do next",
    body:
      ground +
      person(64, 48) +
            `<path d="M100 30 c0 -8 6 -12 12 -12 s12 4 12 11 c0 8 -12 9 -12 18" stroke="{{ACCENT}}" stroke-width="3"/>` +
      `<circle cx="112" cy="56" r="1.5" stroke="{{ACCENT}}" stroke-width="4"/>`,
  },
  {
    id: "money-transfer",
    alt: "Pieniądze przekazywane z jednego portfela do drugiego",
    action: "paying an installment, money moving from one wallet to another",
    body:
      ground +
      `<rect x="18" y="52" width="48" height="36" rx="5" fill="{{PAPER}}"/><path d="M54 64 h12 v12 h-12 a6 6 0 0 1 0 -12 Z"/>` +
      `<rect x="94" y="52" width="48" height="36" rx="5" fill="{{PAPER}}"/><path d="M130 64 h12 v12 h-12 a6 6 0 0 1 0 -12 Z"/>` +
      `<path d="M58 38 C70 24 90 24 102 38 M96 32 L102 38 L94 42" stroke="{{ACCENT}}"/>`,
  },
];

export const illustrations: Record<string, IllustrationDef> = Object.fromEntries(defs.map((d) => [d.id, d]));
export const illustrationIds = defs.map((d) => d.id);

export const ILLUSTRATION_FALLBACK = "person-question";

export function getIllustration(id: string | undefined | null): IllustrationDef {
  return (id && illustrations[id]) || illustrations[ILLUSTRATION_FALLBACK];
}

const ROOT_ATTRS = 'fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"';

/** Pełny dokument SVG z podstawionymi kolorami (do PDF, eksportu, podglądu). */
export function renderIllustrationSvg(id: string, colors: { ink: string; accent: string; paper: string }): string {
  const def = getIllustration(id);
  const body = def.body
    .replaceAll("{{INK}}", colors.ink)
    .replaceAll("{{ACCENT}}", colors.accent)
    .replaceAll("{{PAPER}}", colors.paper);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEWBOX}"><g ${ROOT_ATTRS} stroke="${colors.ink}">${body}</g></svg>`;
}

/** Wnętrze SVG do osadzenia w komponencie React (kolory przez CSS). */
export function illustrationInnerSvg(id: string): string {
  const def = getIllustration(id);
  const body = def.body
    .replaceAll("{{INK}}", "currentColor")
    .replaceAll("{{ACCENT}}", "var(--color-gold)")
    .replaceAll("{{PAPER}}", "var(--color-paper)");
  return `<g ${ROOT_ATTRS} stroke="currentColor">${body}</g>`;
}
