import type { SourceReference } from "@/lib/types";

/**
 * Rejestr źródeł użytych w researchu.
 *
 * Research przeprowadzono 2026-10-16 za pomocą wyszukiwarki internetowej z filtrem
 * domen urzędowych (gov.pl, sejm.gov.pl, uprp.gov.pl, uokik.gov.pl, rf.gov.pl, bgk.pl, euipo.europa.eu).
 * Bezpośrednie pobranie pełnych tekstów nie było możliwe ze środowiska roboczego,
 * dlatego część źródeł ma status „partial” – potwierdzenie pochodzi z treści strony
 * zwróconej przez wyszukiwarkę, a nie z pełnej lektury dokumentu.
 * Przed publikacją redakcja musi otworzyć każde źródło i potwierdzić tezy.
 */

export const RESEARCH_DATE = "2026-10-16";

const r = (s: Omit<SourceReference, "verifiedAt"> & { verifiedAt?: string }): SourceReference => ({
  verifiedAt: RESEARCH_DATE,
  ...s,
});

export const SOURCES = {
  /* ---------- Długi osobiste, upadłość, egzekucja ---------- */
  msPoradnikUpadlosc: r({
    id: "ms-poradnik-upadlosc",
    title: "Upadłość konsumencka i układ konsumencki – praktyczny poradnik dłużnika",
    publisher: "Ministerstwo Sprawiedliwości (gov.pl)",
    url: "https://www.gov.pl/web/sprawiedliwosc/upadlosc-konsumencka-i-uklad-konsumencki--praktyczny-poradnik-dluznika",
    confidence: "partial",
    supports: "Ogólny przebieg upadłości konsumenckiej i układu konsumenckiego, rola nadzorcy sądowego, plan spłaty.",
    note: "Istnieje kilka wersji poradnika (różne załączniki gov.pl). Starsze wersje podają nieaktualne długości planu spłaty – sprawdź datę wydania.",
  }),
  prawoUpadlosciowe: r({
    id: "prawo-upadlosciowe",
    title: "Ustawa z dnia 28 lutego 2003 r. – Prawo upadłościowe (tekst w ISAP/ELI)",
    publisher: "Sejm RP – ISAP",
    url: "https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20030600535",
    confidence: "partial",
    supports:
      "Art. 491¹ i nast. (upadłość osoby fizycznej nieprowadzącej działalności), art. 491¹⁵ (plan spłaty do 36 miesięcy; 36–84 miesięcy przy niewypłacalności spowodowanej umyślnie lub przez rażące niedbalstwo), art. 491²⁵ i nast. (układ na zgromadzeniu wierzycieli), art. 21 (30 dni na wniosek dla przedsiębiorcy).",
    note: "Brzmienie przepisów sprawdzone pośrednio (orzecznictwo, serwisy z tekstem ustawy). Wymaga potwierdzenia w aktualnym tekście jednolitym.",
  }),
  srPoznanOplaty: r({
    id: "sr-poznan-oplaty",
    title: "Informacje o opłatach – Sąd Rejonowy Poznań-Stare Miasto",
    publisher: "Sąd Rejonowy Poznań-Stare Miasto",
    url: "https://poznan-staremiasto.sr.gov.pl/informacje-o-oplatach,sd,m1,222,225,237.html,6",
    confidence: "verified",
    supports: "Opłata od wniosku o ogłoszenie upadłości osoby fizycznej nieprowadzącej działalności gospodarczej: 30 zł.",
  }),
  krzSady: r({
    id: "krz-sady",
    title: "Krajowy Rejestr Zadłużonych – informacja sądu",
    publisher: "Sąd Rejonowy w Białymstoku",
    url: "https://www.bialystok.sr.gov.pl/zalatw-sprawe-przez-internet/krajowy-rejestr-zadluzonych",
    publishedOrUpdated: "2021",
    confidence: "partial",
    supports:
      "KRZ działa od 1 grudnia 2021 r. Osoba fizyczna nieprowadząca działalności może złożyć wniosek o upadłość i pisma bez systemu teleinformatycznego (na formularzu); po ogłoszeniu upadłości pisma składa się już przez system.",
  }),
  krzPortal: r({
    id: "krz-portal",
    title: "Portal Krajowego Rejestru Zadłużonych",
    publisher: "Ministerstwo Sprawiedliwości",
    url: "https://krz.ms.gov.pl",
    confidence: "partial",
    supports: "Elektroniczne składanie pism i obwieszczenia w postępowaniach upadłościowych i restrukturyzacyjnych.",
  }),
  radaLegislacyjnaUD260: r({
    id: "rl-ud260",
    title: "Opinia z 12 stycznia 2026 r. o rządowym projekcie ustawy o zmianie ustawy – Prawo upadłościowe, Prawo restrukturyzacyjne oraz ustawy o KRZ (UD260)",
    publisher: "Rada Legislacyjna (gov.pl)",
    url: "https://www.gov.pl/web/radalegislacyjna/opinia-z-12-stycznia-2026-r-o-rzadowym-projekcie-ustawy-o-zmianie-ustawy--prawo-upadlosciowe-ustawy--prawo-restrukturyzacyjne-oraz-ustawy-o-krajowym-rejestrze-zadluzonych-ud260",
    publishedOrUpdated: "2026-01-12",
    confidence: "verified",
    supports: "Istnienie projektu zmian w upadłości konsumenckiej (m.in. umorzenie po wykonaniu planu).",
    note: "PROJEKT – nie jest obowiązującym prawem. Nie opisujemy go jako aktualnych zasad.",
  }),
  prawoBankowe54: r({
    id: "prawo-bankowe-54",
    title: "Ustawa z dnia 29 sierpnia 1997 r. – Prawo bankowe, art. 54 (kwota wolna od zajęcia na rachunku)",
    publisher: "Sejm RP – ISAP",
    url: "https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19971400939",
    confidence: "partial",
    supports: "W każdym miesiącu kalendarzowym wolne od zajęcia są środki do 75% minimalnego wynagrodzenia – łącznie na rachunkach osoby fizycznej w danym banku.",
  }),
  rfEgzekucja: r({
    id: "rf-egzekucja",
    title: "Postępowanie egzekucyjne – najczęstsze pytania",
    publisher: "Rzecznik Finansowy",
    url: "https://rf.gov.pl/edukacja/baza-wiedzy/najczestsze-pytania-i-odpowiedzi-faq/postepowanie-egzekucyjne/",
    confidence: "partial",
    supports: "Kwota wolna na rachunku, świadczenia wolne od egzekucji (m.in. świadczenie wychowawcze).",
  }),
  placaMinimalna2026: r({
    id: "placa-minimalna-2026",
    title: "Rozporządzenie Rady Ministrów z 11 września 2025 r. w sprawie minimalnego wynagrodzenia za pracę w 2026 r. (Dz.U. 2025 poz. 1242)",
    publisher: "Dziennik Ustaw",
    url: "https://dziennikustaw.gov.pl/DU/2025/1242",
    publishedOrUpdated: "2025-09-15",
    confidence: "verified",
    supports: "Minimalne wynagrodzenie od 1 stycznia 2026 r.: 4806 zł brutto.",
  }),
  rodzina800Egzekucja: r({
    id: "rodzina-egzekucja",
    title: "Środki z programu „Rodzina” zabezpieczone przed egzekucją",
    publisher: "Ministerstwo Rodziny, Pracy i Polityki Społecznej (gov.pl)",
    url: "https://www.gov.pl/web/rodzina/srodki-z-rodzina-500-plus-w-pelni-zabezpieczone-przed-egzekucja",
    confidence: "partial",
    supports: "Świadczenie wychowawcze nie podlega egzekucji (art. 833 § 6 k.p.c.).",
    note: "Komunikat z czasów programu 500+. Zasada niepodlegania egzekucji dotyczy także obecnego świadczenia – potwierdź w aktualnej ustawie.",
  }),
  zielonaLiniaPotracenia: r({
    id: "zielona-linia-potracenia",
    title: "Potrącenia z wynagrodzenia za pracę",
    publisher: "Zielona Linia – Centrum Informacyjne Służb Zatrudnienia",
    url: "https://zielonalinia.gov.pl/potracenia-z-wynagrodzenia-za-prace/",
    confidence: "partial",
    supports: "Kwota wolna przy egzekucji z wynagrodzenia (minimalne wynagrodzenie netto), limit potrąceń 1/2 (alimenty 3/5).",
  }),
  nieodplatnaPomoc: r({
    id: "nieodplatna-pomoc",
    title: "Nieodpłatna pomoc prawna",
    publisher: "Ministerstwo Sprawiedliwości (gov.pl)",
    url: "https://www.gov.pl/web/nieodplatna-pomoc/npp",
    confidence: "verified",
    supports:
      "Ok. 1500 punktów w Polsce; pomoc dla osoby, której nie stać na odpłatną poradę (oświadczenie); także jednoosobowi przedsiębiorcy niezatrudniający pracowników w ostatnim roku; zapisy przez zapisy-np.ms.gov.pl lub w starostwie.",
  }),
  zapisyNpp: r({
    id: "zapisy-npp",
    title: "Zapisy na nieodpłatną pomoc prawną",
    publisher: "Ministerstwo Sprawiedliwości",
    url: "https://zapisy-np.ms.gov.pl",
    confidence: "partial",
    supports: "Formularz zapisu na wizytę w punkcie nieodpłatnej pomocy prawnej.",
  }),
  srKoscianTerminy: r({
    id: "sr-koscian-terminy",
    title: "Rodzaje środków odwoławczych i terminy do ich wniesienia",
    publisher: "Sąd Rejonowy w Kościanie",
    url: "https://koscian.sr.gov.pl/rodzaje-srodkow-odwolawczych-i-terminy-do-ich-wniesienia,m,mg,3,160",
    confidence: "verified",
    supports: "Sprzeciw od nakazu zapłaty – 2 tygodnie od doręczenia; skarga na czynności komornika – tydzień od dnia czynności lub zawiadomienia.",
  }),
  srTorunSkarga: r({
    id: "sr-torun-skarga",
    title: "Skarga na czynności komornika",
    publisher: "Sąd Rejonowy w Toruniu",
    url: "https://torun.sr.gov.pl/skarga-na-czynnosci-komornika,m,mg,503,357",
    confidence: "verified",
    supports: "Termin tygodniowy na skargę na czynności komornika (art. 767 k.p.c.).",
  }),
  msEpu: r({
    id: "ms-epu",
    title: "Elektroniczne postępowanie upominawcze – najczęściej zadawane pytania",
    publisher: "Ministerstwo Sprawiedliwości",
    url: "https://osrodkipomocy.ms.gov.pl/pl/sady-w-internecie/elektroniczne-postepowanie-upominawcze/najczesciej-zadawane-pytania/",
    confidence: "partial",
    supports: "Sprzeciw od nakazu zapłaty w EPU – 2 tygodnie od doręczenia.",
  }),
  przedawnienie2018: r({
    id: "przedawnienie-2018",
    title: "Ustawa z 13 kwietnia 2018 r. o zmianie ustawy – Kodeks cywilny oraz niektórych innych ustaw (Dz.U. 2018 poz. 1104)",
    publisher: "Dziennik Ustaw / ISAP",
    url: "https://isap.sejm.gov.pl/isap.Nsf/download.xsp/WDU20180001104/O/D20181104.pdf",
    publishedOrUpdated: "2018-06-08",
    confidence: "verified",
    supports:
      "Ogólny termin przedawnienia 6 lat, 3 lata dla świadczeń okresowych i roszczeń związanych z działalnością gospodarczą; koniec terminu na koniec roku kalendarzowego (gdy termin ≥ 2 lata); po upływie terminu nie można dochodzić roszczenia przeciwko konsumentowi.",
  }),
  krajowaRadaKomornicza: r({
    id: "krk",
    title: "Krajowa Rada Komornicza – pytania i odpowiedzi, wyszukiwarka komorników",
    publisher: "Krajowa Rada Komornicza",
    url: "https://www.komornik.pl/?page_id=183",
    confidence: "partial",
    supports: "Informacje dla dłużników; możliwość sprawdzenia, czy kancelaria komornicza istnieje.",
  }),
  iwsMalzonek: r({
    id: "iws-malzonek",
    title: "Postępowanie w sprawie nadania klauzuli wykonalności przeciwko małżonkowi dłużnika",
    publisher: "Instytut Wymiaru Sprawiedliwości",
    url: "https://iws.gov.pl/wp-content/uploads/2025/08/Postepowanie-w-sprawie-nadania-klauzuli-wykonalnosci-przeciwko-malzonkowi-dluznika.pdf",
    publishedOrUpdated: "2025",
    confidence: "partial",
    supports: "Art. 41 k.r.o.: zaspokojenie z majątku wspólnego, gdy małżonek zgodził się na zaciągnięcie zobowiązania; bez zgody – ograniczenia.",
  }),
  prawoBankowe75c: r({
    id: "prawo-bankowe-75c",
    title: "Prawo bankowe, art. 75c – wezwanie do zapłaty i wniosek o restrukturyzację (omówienie w orzecznictwie)",
    publisher: "Sąd Apelacyjny w Szczecinie, I ACa 936/21 (Portal Orzeczeń)",
    url: "https://orzeczenia.szczecin.sa.gov.pl/content/$N/155500000000503_I_ACa_000936_2021_Uz_2022-04-22_001",
    publishedOrUpdated: "2022-04-22",
    confidence: "partial",
    supports:
      "Przy opóźnieniu bank wzywa do zapłaty z terminem nie krótszym niż 14 dni roboczych i informuje o możliwości złożenia wniosku o restrukturyzację zadłużenia w tym terminie; odmowę bank uzasadnia na piśmie.",
  }),
  bgkFwk: r({
    id: "bgk-fwk",
    title: "Fundusz Wsparcia Kredytobiorców",
    publisher: "Bank Gospodarstwa Krajowego",
    url: "https://www.bgk.pl/produkty/fundusz-wsparcia-kredytobiorcow/",
    confidence: "partial",
    supports:
      "Wsparcie dla kredytobiorców kredytu mieszkaniowego w trudnej sytuacji: do 40 miesięcy, do 3000 zł miesięcznie, zwrot w 200 nieoprocentowanych ratach (część może zostać umorzona); wniosek składa się w banku kredytującym.",
    note: "Starsze materiały podają inne kwoty (36 mies., 2000 zł). Sprawdź aktualne warunki na stronie BGK.",
  }),

  /* ---------- Firma ---------- */
  parpPostepowania: r({
    id: "parp-postepowania",
    title: "Rodzaje postępowań restrukturyzacyjnych – charakterystyka",
    publisher: "PARP – Centrum Rozwoju MŚP",
    url: "https://www.parp.gov.pl/component/content/article/79135:rodzaje-postepowan-restrukturyzacyjnych-charakterystyka",
    confidence: "partial",
    supports: "Cztery postępowania: o zatwierdzenie układu, przyspieszone postępowanie układowe, postępowanie układowe, postępowanie sanacyjne.",
  }),
  parpOchrona: r({
    id: "parp-ochrona",
    title: "Postępowanie restrukturyzacyjne a ochrona dłużnika przed egzekucją",
    publisher: "PARP – Centrum Rozwoju MŚP",
    url: "https://www.parp.gov.pl/component/content/article/84421:postepowanie-restrukturyzacyjne-a-ochrona-dluznika-przed-egzekucja",
    confidence: "partial",
    supports:
      "W postępowaniu o zatwierdzenie układu ochrona zaczyna się od obwieszczenia w KRZ; jeżeli w ciągu 4 miesięcy nie zostanie złożony wniosek o zatwierdzenie układu, skutki obwieszczenia wygasają (art. 226g Prawa restrukturyzacyjnego).",
  }),
  prawoRestrukturyzacyjne: r({
    id: "prawo-restrukturyzacyjne",
    title: "Ustawa z dnia 15 maja 2015 r. – Prawo restrukturyzacyjne",
    publisher: "Sejm RP – ISAP",
    url: "https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20150000978",
    confidence: "partial",
    supports: "Rodzaje postępowań, nadzorca układu, dzień układowy, art. 226a–226g.",
  }),
  parpPoradnik: r({
    id: "parp-poradnik",
    title: "Poradnik dla przedsiębiorców – restrukturyzacja",
    publisher: "PARP",
    url: "https://www.parp.gov.pl/storage/publications/pdf/poradnik-dla-przedsiebiorcow.pdf",
    confidence: "partial",
    supports: "Praktyczny przebieg restrukturyzacji, wybór nadzorcy, przygotowanie propozycji układowych.",
  }),
  saKatowiceArt21: r({
    id: "sa-katowice-art21",
    title: "Wyrok Sądu Apelacyjnego w Katowicach, V AGa 346/20 – obowiązek złożenia wniosku o upadłość w 30 dni, art. 299 k.s.h.",
    publisher: "Portal Orzeczeń Sądu Apelacyjnego w Katowicach",
    url: "https://orzeczenia.katowice.sa.gov.pl/content/$N/151500000002503_V_AGa_000346_2020_Uz_2022-03-31_003",
    publishedOrUpdated: "2022-03-31",
    confidence: "partial",
    supports:
      "Art. 21 ust. 1 Prawa upadłościowego – 30 dni od wystąpienia podstawy ogłoszenia upadłości; art. 299 k.s.h. – osobista odpowiedzialność członków zarządu sp. z o.o. przy bezskutecznej egzekucji, z możliwością uwolnienia się (m.in. wykazanie złożenia wniosku we właściwym czasie).",
  }),

  /* ---------- IP BOX ---------- */
  ipBoxObjasnienia: r({
    id: "ip-box-objasnienia",
    title: "Objaśnienia podatkowe z 15 lipca 2019 r. w sprawie preferencyjnego opodatkowania dochodów wytwarzanych przez prawa własności intelektualnej – IP Box",
    publisher: "Ministerstwo Finansów",
    url: "https://podatki-arch.mf.gov.pl/pit/wyjasnienia-pit/objasnienia-podatkowe-ip-box/",
    publishedOrUpdated: "2019-07-15",
    confidence: "partial",
    supports:
      "5% od kwalifikowanego dochodu (dochód z kwalifikowanego IP × wskaźnik nexus); autorskie prawo do programu komputerowego jako kwalifikowane IP; wymóg działalności B+R; odrębna ewidencja; brak preferencji przy ryczałcie od przychodów ewidencjonowanych.",
    note: "Objaśnienia z 2019 r. – sprawdź, czy nie zostały zaktualizowane lub zastąpione.",
  }),
  ipBoxPoradnik: r({
    id: "ip-box-poradnik",
    title: "IP BOX – rozliczenie dochodów z kwalifikowanych praw własności intelektualnej (PIT)",
    publisher: "podatki.gov.pl",
    url: "https://www.podatki.gov.pl/poradniki-i-informatory/ip-box-rozliczenie-dochodow-z-kwalifikowanych-praw-wlasnosci-intelektualnej-pit",
    confidence: "unverified",
    supports: "Oficjalny poradnik rozliczenia IP BOX w PIT.",
    note: "Źródło wskazane w briefie redakcyjnym; treści nie udało się pobrać w trakcie researchu.",
  }),
  interpretacjaIndywidualna: r({
    id: "interpretacja-indywidualna",
    title: "Uzyskaj podatkową interpretację indywidualną",
    publisher: "gov.pl",
    url: "https://www.gov.pl/web/gov/uzyskaj-podatkowa-interpretacje-indywidualna",
    confidence: "verified",
    supports: "Opłata 40 zł za każdy opisany stan faktyczny lub zdarzenie przyszłe, płatna przed złożeniem wniosku.",
  }),
  eureka: r({
    id: "eureka",
    title: "Eureka – baza interpretacji podatkowych",
    publisher: "Ministerstwo Finansów",
    url: "https://eureka.mf.gov.pl",
    confidence: "verified",
    supports: "Wyszukiwanie wydanych interpretacji indywidualnych (m.in. IP Box dla programistów).",
  }),

  /* ---------- Znaki towarowe ---------- */
  uprpOplatyZgloszeniowe: r({
    id: "uprp-oplaty",
    title: "Znaki towarowe – opłaty zgłoszeniowe (procedura krajowa)",
    publisher: "Urząd Patentowy RP",
    url: "https://uprp.gov.pl/pl/przedmioty-ochrony/znaki-towarowe/procedura-krajowa-/oplaty-zgloszeniowe",
    confidence: "verified",
    supports: "Zgłoszenie elektroniczne (PUEUP): 400 zł za jedną klasę, 120 zł za każdą kolejną; zgłoszenie papierowe: 450 zł za jedną klasę.",
  }),
  uprpOplatyOchrona: r({
    id: "uprp-ochrona",
    title: "Znaki towarowe – opłaty za ochronę (przedłużenie)",
    publisher: "Urząd Patentowy RP",
    url: "https://uprp.gov.pl/pl/przedmioty-ochrony/znaki-towarowe/procedura-krajowa-/oplaty-za-ochrone-przedluzenie",
    confidence: "partial",
    supports: "Opłata za pierwszy okres ochrony wskazana w decyzji warunkowej, płatna w terminie 3 miesięcy od doręczenia; naliczana od liczby klas; ochrona 10 lat od daty zgłoszenia.",
    note: "Kwotę 400 zł za klasę za okres ochrony i 90 zł za publikację znaleziono w materiałach pomocniczych – potwierdź w aktualnej tabeli opłat.",
  }),
  uprpSprzeciw: r({
    id: "uprp-sprzeciw",
    title: "Procedura sprzeciwowa – wniesienie sprzeciwu",
    publisher: "Urząd Patentowy RP",
    url: "https://uprp.gov.pl/pl/przedmioty-ochrony/znaki-towarowe/procedura-krajowa-/procedura-sprzeciwowa/wniesienie-sprzeciwu",
    confidence: "verified",
    supports: "Sprzeciw w terminie 3 miesięcy od ogłoszenia o zgłoszeniu w Biuletynie Urzędu Patentowego; termin nie podlega przywróceniu; możliwość ugody (2 miesiące, przedłużalne do 6).",
  }),
  uprpProcedura: r({
    id: "uprp-procedura",
    title: "Jak wygląda procedura udzielania prawa ochronnego",
    publisher: "Urząd Patentowy RP",
    url: "https://uprp.gov.pl/pl/przedmioty-ochrony/znaki-towarowe/znaki-towarowe-informacje-podstawowe/jak-wyglada-procedura-udzielania-prawa-ochronnego",
    confidence: "partial",
    supports: "Etapy: zgłoszenie, badanie, publikacja w BUP, okres sprzeciwowy, decyzja; UPRP nie bada z urzędu wcześniejszych znaków innych osób (przeszkody względne – w trybie sprzeciwu).",
  }),
  uprpBazaWiedzy: r({
    id: "uprp-baza-wiedzy",
    title: "Baza wiedzy Platformy Usług Elektronicznych UPRP",
    publisher: "Urząd Patentowy RP",
    url: "https://ebazawiedzy.pue.uprp.gov.pl/",
    confidence: "partial",
    supports: "Instrukcje zgłoszeń elektronicznych przez PUEUP.",
  }),
  euipoOplaty: r({
    id: "euipo-oplaty",
    title: "Opłaty uiszczane bezpośrednio na rzecz EUIPO",
    publisher: "EUIPO",
    url: "https://www.euipo.europa.eu/pl/trade-marks/before-applying/fees-payable-direct-to-the-euipo",
    confidence: "verified",
    supports: "Znak towarowy UE online: 850 EUR za 1 klasę, 50 EUR za drugą, 150 EUR za każdą kolejną; ochrona 10 lat.",
  }),
  biznesZgloszenieZnaku: r({
    id: "biznes-znak",
    title: "Zgłoszenie znaku towarowego w Urzędzie Patentowym",
    publisher: "biznes.gov.pl",
    url: "https://www.biznes.gov.pl/pl/portal/ou598",
    confidence: "partial",
    supports: "Przebieg zgłoszenia, opłaty, pełnomocnik (opłata skarbowa od pełnomocnictwa 17 zł).",
  }),

  /* ---------- Rozwód ---------- */
  soWarszawaPragaZwrot: r({
    id: "so-praga-zwrot",
    title: "Zwrot opłaty sądowej",
    publisher: "Sąd Okręgowy Warszawa-Praga w Warszawie",
    url: "https://warszawapraga.so.gov.pl/artykul/153/97/zwrot-oplaty-sadowej",
    confidence: "verified",
    supports: "Zwrot połowy opłaty od pozwu, gdy sąd orzeka rozwód na zgodny wniosek stron bez orzekania o winie – po uprawomocnieniu wyroku.",
  }),
  soLodzOplata: r({
    id: "so-lodz-oplata",
    title: "Pytania w sprawach cywilnych",
    publisher: "Sąd Okręgowy w Łodzi",
    url: "https://lodz.so.gov.pl/pytania-w-sprawach-cywilnych,m,mg,72,31,168",
    confidence: "verified",
    supports: "Opłata od pozwu o rozwód jest stała i wynosi 600 zł; sprawy rozwodowe rozpoznaje sąd okręgowy.",
  }),
  soRzeszowPozew: r({
    id: "so-rzeszow-pozew",
    title: "Jak wnieść pozew o rozwód i separację",
    publisher: "Sąd Okręgowy w Rzeszowie",
    url: "https://rzeszow.so.gov.pl/jak-wniesc-pozew-o-rozwod-i-separacje.html",
    confidence: "partial",
    supports: "Elementy pozwu, załączniki, możliwość wniosku o zwolnienie od kosztów sądowych.",
  }),
  mediacjaKoszty: r({
    id: "mediacja-koszty",
    title: "Mediacja w sprawach rodzinnych oraz o rozwód i separację",
    publisher: "Sąd Okręgowy w Piotrkowie Trybunalskim",
    url: "https://piotrkow-tryb.so.gov.pl/mediacja-w-sprawach-rodzinnych-oraz-o-rozwod-i-separacje,m,mg,213,215",
    confidence: "partial",
    supports:
      "Mediacja z polecenia sądu w sprawach niemajątkowych: 150 zł za pierwsze posiedzenie, 100 zł za kolejne, łącznie nie więcej niż 450 zł (rozporządzenie MS z 2016 r.); w sprawach majątkowych 1% wartości (150–2000 zł); koszty zwykle po połowie.",
  }),
  govMediacje: r({
    id: "gov-mediacje",
    title: "Rozwiąż spór przez mediacje",
    publisher: "gov.pl",
    url: "https://www.gov.pl/web/gov/rozwiaz-spor-przez-mediacje",
    confidence: "partial",
    supports: "Czym jest mediacja, jak znaleźć mediatora, ugoda zatwierdzana przez sąd.",
  }),
  soGliwiceMediacjaPrzemoc: r({
    id: "so-gliwice-mediacja",
    title: "Mediacja w sprawach rodzinnych",
    publisher: "Sąd Okręgowy w Gliwicach",
    url: "https://gliwice.so.gov.pl/mediacja-w-sprawach-rodzinnych,new,mg,72,84.html,672",
    confidence: "partial",
    supports: "Przy przemocy w rodzinie skierowanie do mediacji jest niewłaściwe – narusza równość stron.",
  }),
  niebieskaLinia: r({
    id: "niebieska-linia",
    title: "Pogotowie „Niebieska Linia” całodobowo",
    publisher: "Ministerstwo Rodziny, Pracy i Polityki Społecznej (gov.pl)",
    url: "https://www.gov.pl/web/rodzina/pogotowie-niebieska-linia-calodobowo",
    confidence: "verified",
    supports: "Bezpłatny, całodobowy telefon dla osób doznających przemocy domowej: 800 120 002.",
  }),
  msRozwodUsc: r({
    id: "ms-rozwod-usc",
    title: "Nowe rozwiązania w prawie rodzinnym – możliwość rozwodu przed urzędem stanu cywilnego",
    publisher: "Ministerstwo Sprawiedliwości (gov.pl)",
    url: "https://www.gov.pl/web/sprawiedliwosc/nowe-rozwiazania-w-prawie-rodzinnym---mozliwosc-rozwodu-przed-urzedem-stanu-cywilnego",
    confidence: "partial",
    supports: "Projekt rozwodu pozasądowego w USC (druk sejmowy nr 2121).",
    note: "Według doniesień prasowych ustawa uchwalona przez Sejm w marcu 2026 r. została zawetowana przez Prezydenta. NIE obowiązuje – rozwód orzeka wyłącznie sąd. Status wymaga potwierdzenia na stronie Sejmu.",
  }),

  /* ---------- Kredyty / SKD ---------- */
  rfSkdWebinar: r({
    id: "rf-skd",
    title: "Sankcja kredytu darmowego – materiał z webinarium (13.03.2025)",
    publisher: "Rzecznik Finansowy",
    url: "https://rf.gov.pl/wp-content/uploads/2025/03/13.03-Sankcja-Kredytu-Darmowego.pdf",
    publishedOrUpdated: "2025-03-13",
    confidence: "partial",
    supports:
      "SKD dotyczy umów o kredyt konsumencki (do 255 550 zł lub równowartości; osobno kredyt niezabezpieczony hipoteką na remont); nie obejmuje obecnie kredytów hipotecznych; wymaga naruszenia przepisów z art. 45 ust. 1 i pisemnego oświadczenia konsumenta.",
  }),
  rfTsue: r({
    id: "rf-tsue",
    title: "Wyrok TSUE zgodny z opinią Rzecznika Finansowego (C-472/23, 13.02.2025)",
    publisher: "Rzecznik Finansowy",
    url: "https://rf.gov.pl/wyrok-tsue-zgodny-z-opinia-rzecznika-finansowego/",
    publishedOrUpdated: "2025-02-13",
    confidence: "partial",
    supports: "Wyrok TSUE w sprawie C-472/23 dotyczący obowiązków informacyjnych i proporcjonalności sankcji.",
  }),
  ustawaKredytKonsumencki: r({
    id: "ukk",
    title: "Ustawa z dnia 12 maja 2011 r. o kredycie konsumenckim",
    publisher: "Sejm RP – ISAP",
    url: "https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20111260715",
    confidence: "partial",
    supports: "Art. 30 (elementy umowy), art. 45 (sankcja kredytu darmowego; uprawnienie wygasa po roku od wykonania umowy).",
  }),
  soWarszawaSkdTermin: r({
    id: "so-warszawa-skd",
    title: "Wyrok Sądu Okręgowego w Warszawie, V Ca 487/24 – początek rocznego terminu na SKD",
    publisher: "Portal Orzeczeń Sądu Okręgowego w Warszawie",
    url: "https://orzeczenia.warszawa.so.gov.pl/content/$N/154505000001503_V_Ca_000487_2024_Uz_2025-01-09_001",
    publishedOrUpdated: "2025-01-09",
    confidence: "partial",
    supports: "Orzecznictwo jest rozbieżne co do tego, od kiedy liczyć roczny termin z art. 45 ust. 5 (np. od wypłaty kredytu lub od wykonania umowy przez obie strony).",
  }),
  uokik: r({
    id: "uokik",
    title: "Urząd Ochrony Konkurencji i Konsumentów",
    publisher: "UOKiK",
    url: "https://uokik.gov.pl/",
    confidence: "partial",
    supports: "Ogólne informacje dla konsumentów, rzecznicy konsumentów.",
  }),
  uokikOdstapienie: r({
    id: "uokik-odstapienie",
    title: "Prawo odstąpienia od umowy – terminy",
    publisher: "UOKiK – prawakonsumenta.uokik.gov.pl",
    url: "https://prawakonsumenta.uokik.gov.pl/prawo-odstapienia-od-umowy/terminy-odstapienie/",
    confidence: "verified",
    supports:
      "14 dni na odstąpienie od umowy zawartej na odległość lub poza lokalem bez podania przyczyny; przy towarze termin liczony od jego otrzymania; 12 miesięcy dłużej, gdy przedsiębiorca nie poinformował o prawie; zwrot płatności w 14 dni.",
  }),
  rfRzecznik: r({
    id: "rf",
    title: "Rzecznik Finansowy – pomoc dla klientów rynku finansowego",
    publisher: "Rzecznik Finansowy",
    url: "https://rf.gov.pl/",
    confidence: "partial",
    supports: "Bezpłatna pomoc dla klientów banków: wnioski o interwencję, postępowanie polubowne, porady.",
  }),
} satisfies Record<string, SourceReference>;

export type SourceKey = keyof typeof SOURCES;

export const pick = (...keys: SourceKey[]): SourceReference[] => keys.map((k) => SOURCES[k]);
