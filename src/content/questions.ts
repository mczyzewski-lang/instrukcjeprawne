import type { CategorySlug, Question } from "@/lib/types";
import { pick, RESEARCH_DATE, type SourceKey } from "./sources";

/**
 * Pytania z przygotowaną odpowiedzią (status „review” – do zatwierdzenia przez redakcję).
 * Każda odpowiedź opiera się na źródłach z rejestru SOURCES.
 */

type QInput = {
  slug: string;
  title: string;
  category: CategorySlug;
  answer: string;
  actions: string[];
  explanation?: string;
  sources: SourceKey[];
  relatedInstruction: string | null;
  relatedPath?: string;
  relatedQuestions?: string[];
  status?: Question["status"];
  editorialNote?: string;
};

const q = (i: QInput): Question => ({
  id: `q-${i.slug}`,
  slug: i.slug,
  title: i.title,
  category: i.category,
  answer: i.answer,
  actions: i.actions,
  explanation: i.explanation,
  sourceReferences: pick(...i.sources),
  relatedInstruction: i.relatedInstruction,
  relatedPath: i.relatedPath ?? null,
  relatedQuestions: i.relatedQuestions ?? [],
  relatedVideo: null,
  status: i.status ?? "review",
  editorialNote: i.editorialNote,
  aiAssisted: true,
  legalReviewedAt: null,
  updatedAt: RESEARCH_DATE,
});

export const ANSWERED_QUESTIONS: Question[] = [
  q({
    slug: "czy-komornik-moze-zajac-cale-konto",
    title: "Czy komornik może zająć całe konto?",
    category: "dlugi-i-komornik",
    answer:
      "Nie. Na rachunku osobistym w każdym miesiącu wolne od zajęcia są środki do 75% minimalnego wynagrodzenia. W 2026 r. to 3604,50 zł. Ochrona nie dotyczy rachunków firmowych.",
    actions: [
      "Zapytaj bank, jaka kwota wolna została uwzględniona w tym miesiącu.",
      "Jeśli zajęto więcej – zgłoś to bankowi i komornikowi, a w razie potrzeby złóż skargę na czynność komornika w ciągu tygodnia.",
      "Sprawdź, czy na koncie nie ma świadczeń wolnych od egzekucji, np. świadczenia wychowawczego.",
    ],
    explanation:
      "Kwota wolna wynika z art. 54 Prawa bankowego i jest powiązana z minimalnym wynagrodzeniem, które w 2026 r. wynosi 4806 zł brutto. Kwota przysługuje w każdym miesiącu kalendarzowym.",
    sources: ["prawoBankowe54", "placaMinimalna2026", "rfEgzekucja", "srTorunSkarga"],
    relatedInstruction: "co-zrobic-gdy-komornik-zajal-konto",
    relatedPath: "kwota-wolna",
    relatedQuestions: ["czy-komornik-moze-zajac-800-plus", "ile-komornik-moze-zabrac-z-pensji"],
  }),
  q({
    slug: "czy-komornik-moze-zajac-800-plus",
    title: "Czy komornik może zająć 800+?",
    category: "dlugi-i-komornik",
    answer:
      "Świadczenie wychowawcze (800+) nie podlega egzekucji. Jeśli jednak trafi na zwykłe konto, bank może go nie odróżnić od innych środków – wtedy trzeba zareagować.",
    actions: [
      "Zgłoś bankowi i komornikowi, że zajęte środki pochodzą ze świadczenia wychowawczego.",
      "Przygotuj dowód: decyzję lub informację o przyznaniu świadczenia i historię wpływów.",
      "Jeśli komornik nie zwolni środków – złóż skargę na jego czynność w terminie tygodnia.",
    ],
    sources: ["rodzina800Egzekucja", "rfEgzekucja", "srTorunSkarga"],
    relatedInstruction: "co-zrobic-gdy-komornik-zajal-konto",
    relatedPath: "kwota-wolna",
    relatedQuestions: ["czy-komornik-moze-zajac-cale-konto"],
  }),
  q({
    slug: "ile-komornik-moze-zabrac-z-pensji",
    title: "Ile komornik może zabrać z pensji?",
    category: "dlugi-i-komornik",
    answer:
      "Przy długach innych niż alimenty – najwyżej połowę wynagrodzenia netto, a kwota równa minimalnemu wynagrodzeniu netto musi zostać. Przy alimentach – do trzech piątych wynagrodzenia, bez kwoty wolnej.",
    actions: [
      "Sprawdź na pasku wypłaty, ile potrącił pracodawca.",
      "Jeśli pracujesz na część etatu, kwota wolna jest odpowiednio niższa.",
      "Przy wątpliwościach zapytaj dział kadr albo Państwową Inspekcję Pracy.",
    ],
    sources: ["zielonaLiniaPotracenia", "placaMinimalna2026"],
    relatedInstruction: "co-zrobic-gdy-komornik-zajal-konto",
    relatedPath: "kwota-wolna",
  }),
  q({
    slug: "czy-mozna-oglosic-upadlosc-bez-majatku",
    title: "Czy można ogłosić upadłość bez majątku?",
    category: "dlugi-i-komornik",
    answer:
      "Tak. Brak majątku nie wyklucza upadłości konsumenckiej. Koszty postępowania mogą być wtedy tymczasowo pokryte przez Skarb Państwa. Sąd ustala plan spłaty dopasowany do Twoich możliwości.",
    actions: [
      "Sprawdź, czy jesteś niewypłacalny – czyli trwale nie możesz spłacać wymagalnych długów.",
      "Przygotuj listę wierzycieli i dokumenty o dochodach.",
      "Wypełnij formularz wniosku i wnieś opłatę 30 zł.",
    ],
    explanation:
      "Plan spłaty trwa co do zasady do 36 miesięcy. Gdy Twoja sytuacja w oczywisty sposób pokazuje, że trwale nie możesz nic spłacać, sąd może umorzyć długi bez planu spłaty.",
    sources: ["msPoradnikUpadlosc", "prawoUpadlosciowe", "srPoznanOplaty"],
    relatedInstruction: "jak-wyjsc-z-dlugow",
    relatedPath: "upadlosc",
    relatedQuestions: ["ile-kosztuje-upadlosc-konsumencka", "ile-trwa-plan-splaty-w-upadlosci"],
  }),
  q({
    slug: "ile-kosztuje-upadlosc-konsumencka",
    title: "Ile kosztuje upadłość konsumencka?",
    category: "dlugi-i-komornik",
    answer:
      "Opłata od wniosku o ogłoszenie upadłości osoby nieprowadzącej działalności to 30 zł. Koszty postępowania, w tym wynagrodzenie syndyka, pokrywane są z majątku, a gdy go brak – tymczasowo przez Skarb Państwa.",
    actions: ["Wnieś opłatę 30 zł przed złożeniem wniosku i dołącz dowód wpłaty.", "Sprawdź numer konta na stronie właściwego sądu rejonowego."],
    sources: ["srPoznanOplaty", "msPoradnikUpadlosc"],
    relatedInstruction: "jak-wyjsc-z-dlugow",
    relatedPath: "upadlosc",
  }),
  q({
    slug: "ile-trwa-plan-splaty-w-upadlosci",
    title: "Ile trwa plan spłaty w upadłości konsumenckiej?",
    category: "dlugi-i-komornik",
    answer:
      "Co do zasady nie dłużej niż 36 miesięcy. Jeśli niewypłacalność powstała umyślnie lub przez rażące niedbalstwo, plan może trwać od 36 do 84 miesięcy.",
    actions: ["Przygotuj realny budżet – sąd bierze pod uwagę Twoje możliwości zarobkowe i koszty utrzymania.", "Opisz we wniosku rzetelnie przyczyny niewypłacalności."],
    explanation: "Starsze poradniki mogą podawać inne okresy. Sprawdzaj datę dokumentu, z którego korzystasz.",
    sources: ["prawoUpadlosciowe", "msPoradnikUpadlosc"],
    relatedInstruction: "jak-wyjsc-z-dlugow",
    relatedPath: "upadlosc",
  }),
  q({
    slug: "czy-mozna-wyjsc-z-dlugow-bez-upadlosci",
    title: "Czy można wyjść z długów bez ogłaszania upadłości?",
    category: "dlugi-i-komornik",
    answer:
      "Tak. Możesz porozumieć się z wierzycielami (nowy harmonogram, raty), przy kredycie złożyć wniosek o restrukturyzację zadłużenia, sprawdzić, czy długi są prawidłowe, albo skorzystać z układu konsumenckiego, w którym wierzyciele głosują nad Twoją propozycją spłaty.",
    actions: ["Spisz wszystkie długi i policz budżet.", "Zaproponuj wierzycielom realny harmonogram na piśmie.", "Jeśli wierzycieli jest wielu – sprawdź układ konsumencki."],
    sources: ["msPoradnikUpadlosc", "prawoBankowe75c"],
    relatedInstruction: "jak-wyjsc-z-dlugow",
    relatedPath: "negocjacje",
  }),
  q({
    slug: "czy-dlugi-przechodza-na-wspolmalzonka",
    title: "Czy długi przechodzą na współmałżonka?",
    category: "dlugi-i-komornik",
    answer:
      "Nie automatycznie. Jeśli tylko jeden małżonek zaciągnął dług, wierzyciel może sięgnąć po cały majątek wspólny głównie wtedy, gdy drugi małżonek wyraził zgodę na zaciągnięcie zobowiązania. Bez zgody możliwości wierzyciela są ograniczone.",
    actions: [
      "Sprawdź, czy podpisywałeś/aś zgodę na kredyt lub pożyczkę małżonka.",
      "Jeśli jesteście współkredytobiorcami – odpowiadacie oboje.",
      "Przy egzekucji ze wspólnego rachunku sprawdź możliwość obrony małżonka dłużnika.",
    ],
    sources: ["iwsMalzonek"],
    relatedInstruction: "jak-wyjsc-z-dlugow",
  }),
  q({
    slug: "co-zrobic-po-otrzymaniu-nakazu-zaplaty",
    title: "Co zrobić po otrzymaniu nakazu zapłaty?",
    category: "inne-sprawy",
    answer:
      "Sprawdź datę odebrania pisma. Masz 2 tygodnie na sprzeciw (w postępowaniu nakazowym – zarzuty). Jeśli nie zareagujesz, nakaz zwykle się uprawomocni i może trafić do komornika.",
    actions: [
      "Zapisz datę doręczenia – od niej liczysz 2 tygodnie.",
      "Przeczytaj pouczenie: do jakiego sądu, w jakiej formie i czy trzeba wnieść opłatę.",
      "W sprzeciwie napisz, co kwestionujesz (np. przedawnienie, wysokość, brak długu).",
      "Jeśli nie masz pewności – idź od razu do punktu nieodpłatnej pomocy prawnej.",
    ],
    sources: ["srKoscianTerminy", "msEpu", "przedawnienie2018", "nieodplatnaPomoc"],
    relatedInstruction: "jak-wyjsc-z-dlugow",
    relatedPath: "weryfikacja",
    relatedQuestions: ["kiedy-dlug-sie-przedawnia"],
  }),
  q({
    slug: "kiedy-dlug-sie-przedawnia",
    title: "Kiedy dług się przedawnia?",
    category: "dlugi-i-komornik",
    answer:
      "Ogólny termin to 6 lat. Dla świadczeń okresowych i długów związanych z działalnością gospodarczą wierzyciela (np. wobec banku, firmy pożyczkowej) – 3 lata. Termin kończy się z końcem roku kalendarzowego.",
    actions: [
      "Ustal, kiedy dług stał się wymagalny.",
      "Sprawdź, czy bieg terminu nie został przerwany – np. przez uznanie długu, pozew lub wszczęcie egzekucji.",
      "Nie ignoruj pism z sądu – przedawnienie trzeba wykazać w sprawie.",
    ],
    explanation:
      "Po upływie terminu przedawnienia nie można dochodzić roszczenia przeciwko konsumentowi. Sąd powinien to uwzględnić sam, ale warto napisać to wprost w sprzeciwie lub odpowiedzi na pozew.",
    sources: ["przedawnienie2018"],
    relatedInstruction: "jak-wyjsc-z-dlugow",
    relatedPath: "weryfikacja",
  }),
  q({
    slug: "czy-bank-moze-sprzedac-moj-dlug",
    title: "Czy bank może sprzedać mój dług?",
    category: "kredyty-i-banki",
    answer:
      "Tak, wierzyciel może przenieść dług na inną firmę (np. fundusz windykacyjny). Nowy wierzyciel ma takie same prawa jak poprzedni – nie większe. Zachowujesz wszystkie zarzuty, które miałeś/aś wobec banku, w tym przedawnienie.",
    actions: [
      "Poproś nowego wierzyciela o dokument potwierdzający przejęcie długu i wyliczenie kwoty.",
      "Sprawdź, czy dług nie jest przedawniony.",
      "Płać tylko na rachunek, którego wiarygodność potwierdzisz.",
    ],
    sources: ["przedawnienie2018"],
    relatedInstruction: "jak-wyjsc-z-dlugow",
    relatedPath: "weryfikacja",
  }),
  q({
    slug: "czy-komornik-moze-zabrac-samochod",
    title: "Czy komornik może zabrać samochód?",
    category: "dlugi-i-komornik",
    answer:
      "Tak, samochód dłużnika co do zasady może zostać zajęty i sprzedany w egzekucji. Przepisy wyłączają spod egzekucji tylko niektóre rzeczy, np. niezbędne do pracy zarobkowej – czy dotyczy to Twojego auta, zależy od okoliczności.",
    actions: [
      "Sprawdź w piśmie komornika, z jakiego majątku prowadzona jest egzekucja.",
      "Jeśli auto jest niezbędne do pracy – zgłoś to komornikowi i przygotuj dowody.",
      "Porozmawiaj z wierzycielem o spłacie ratalnej, zanim dojdzie do licytacji.",
    ],
    explanation: "Szczegółowy katalog rzeczy wyłączonych spod egzekucji znajduje się w Kodeksie postępowania cywilnego. Ta odpowiedź wymaga uzupełnienia o potwierdzone przepisy.",
    sources: ["krajowaRadaKomornicza"],
    relatedInstruction: "co-zrobic-gdy-komornik-zajal-konto",
    status: "draft",
    editorialNote: "Szkic – brak potwierdzonego katalogu rzeczy wyłączonych spod egzekucji (art. 829 k.p.c.). Nie publikować przed weryfikacją.",
  }),
  q({
    slug: "co-zrobic-gdy-rata-przekracza-dochod",
    title: "Co zrobić, gdy rata przekracza miesięczny dochód?",
    category: "kredyty-i-banki",
    answer:
      "Skontaktuj się z bankiem przed terminem raty i złóż wniosek o zmianę warunków spłaty. Jeśli to kredyt mieszkaniowy, sprawdź Fundusz Wsparcia Kredytobiorców. Gdy długów jest więcej – uporządkuj je i sprawdź układ konsumencki lub upadłość.",
    actions: ["Policz budżet i realną ratę.", "Złóż w banku wniosek o zmianę harmonogramu lub restrukturyzację.", "Przy kredycie mieszkaniowym zapytaj bank o wniosek do Funduszu Wsparcia Kredytobiorców."],
    sources: ["prawoBankowe75c", "bgkFwk"],
    relatedInstruction: "co-zrobic-gdy-nie-mozesz-splacac-rat-kredytu",
  }),
  q({
    slug: "jak-dziala-skarga-na-komornika",
    title: "Jak złożyć skargę na komornika?",
    category: "dlugi-i-komornik",
    answer:
      "Skargę na czynność komornika składasz do sądu rejonowego, przy którym działa komornik, w terminie tygodnia od dnia czynności albo od zawiadomienia o niej. Sądy wskazują opłatę 50 zł.",
    actions: ["Zapisz datę czynności lub zawiadomienia.", "Opisz, którą czynność zaskarżasz i dlaczego jest wadliwa.", "Wnieś opłatę i złóż skargę w terminie."],
    sources: ["srTorunSkarga", "srKoscianTerminy"],
    relatedInstruction: "co-zrobic-gdy-komornik-zajal-konto",
    relatedPath: "skarga",
  }),
  q({
    slug: "gdzie-znalezc-bezplatna-pomoc-prawna",
    title: "Gdzie znaleźć bezpłatną pomoc prawną?",
    category: "inne-sprawy",
    answer:
      "W punktach nieodpłatnej pomocy prawnej – jest ich około 1500 w całej Polsce. Wystarczy oświadczenie, że nie stać Cię na odpłatną poradę. Zapiszesz się przez zapisy-np.ms.gov.pl, telefonicznie lub w starostwie.",
    actions: ["Wejdź na zapisy-np.ms.gov.pl i wybierz punkt – nie musi być w Twoim powiecie.", "Zabierz dokumenty i zapisz pytania."],
    explanation: "Z pomocy może skorzystać też jednoosobowy przedsiębiorca, który w ostatnim roku nie zatrudniał innych osób.",
    sources: ["nieodplatnaPomoc", "zapisyNpp"],
    relatedInstruction: null,
  }),
  q({
    slug: "czy-czlonek-zarzadu-odpowiada-za-dlugi-spolki",
    title: "Czy członek zarządu odpowiada za długi spółki z o.o.?",
    category: "firma-w-trudnosciach",
    answer:
      "Może odpowiadać osobiście, jeśli egzekucja przeciwko spółce okaże się bezskuteczna. Może się od tej odpowiedzialności uwolnić, wykazując m.in., że wniosek o upadłość złożono we właściwym czasie (w ciągu 30 dni od niewypłacalności) albo że w tym czasie otwarto postępowanie restrukturyzacyjne lub zatwierdzono układ.",
    actions: [
      "Ustal, od kiedy spółka może być niewypłacalna.",
      "Nie odkładaj decyzji o wniosku restrukturyzacyjnym lub upadłościowym.",
      "Dokumentuj decyzje zarządu i stan finansów spółki.",
    ],
    sources: ["saKatowiceArt21", "prawoUpadlosciowe"],
    relatedInstruction: "jak-wyjsc-z-dlugow-firmowych",
    relatedPath: "odpowiedzialnosc",
  }),
  q({
    slug: "co-to-jest-dzien-ukladowy",
    title: "Co to jest dzień układowy i jak chroni firmę?",
    category: "firma-w-trudnosciach",
    answer:
      "To dzień wskazany w obwieszczeniu w Krajowym Rejestrze Zadłużonych w postępowaniu o zatwierdzenie układu. Od obwieszczenia toczące się egzekucje są zawieszane. Jeśli w ciągu 4 miesięcy nie zostanie złożony wniosek o zatwierdzenie układu, ochrona wygasa.",
    actions: ["Wybierz nadzorcę układu (licencjonowanego doradcę restrukturyzacyjnego).", "Przygotuj spis wierzytelności i propozycje układowe przed obwieszczeniem.", "Zaplanuj zbieranie głosów w 4 miesiącach."],
    sources: ["parpOchrona", "prawoRestrukturyzacyjne"],
    relatedInstruction: "jak-wyjsc-z-dlugow-firmowych",
    relatedPath: "pzu",
  }),
  q({
    slug: "kiedy-trzeba-zlozyc-wniosek-o-upadlosc-firmy",
    title: "Kiedy trzeba złożyć wniosek o upadłość firmy?",
    category: "firma-w-trudnosciach",
    answer:
      "Najpóźniej w ciągu 30 dni od dnia, w którym wystąpiła podstawa ogłoszenia upadłości, czyli niewypłacalność. Opóźnienie w płaceniu zobowiązań ponad 3 miesiące jest traktowane jako sygnał niewypłacalności.",
    actions: ["Sprawdź wiekowanie zobowiązań – które są przeterminowane ponad 3 miesiące.", "Rozważ restrukturyzację jako alternatywę – jeśli firma ma szansę na rentowność.", "Zapisz datę, od której liczysz 30 dni."],
    sources: ["saKatowiceArt21", "prawoUpadlosciowe"],
    relatedInstruction: "jak-wyjsc-z-dlugow-firmowych",
    relatedPath: "upadlosc",
  }),
  q({
    slug: "czy-programista-na-b2b-moze-skorzystac-z-ip-box",
    title: "Czy każdy programista na B2B może skorzystać z IP BOX?",
    category: "podatki-przedsiebiorcy",
    answer:
      "Nie każdy. Musisz tworzyć, rozwijać lub ulepszać program w ramach działalności badawczo-rozwojowej, osiągać dochód z praw autorskich do tego programu, rozliczać się na skali lub podatku liniowym i prowadzić odrębną ewidencję. 5% dotyczy tylko kwalifikowanego dochodu.",
    actions: ["Sprawdź zapisy umowy o prawach autorskich.", "Załóż odrębną ewidencję dla każdego programu.", "Rozważ interpretację indywidualną (40 zł za stan faktyczny)."],
    sources: ["ipBoxObjasnienia", "interpretacjaIndywidualna"],
    relatedInstruction: "jak-placic-5-procent-podatku-jako-programista",
    relatedPath: "kwalifikacja",
  }),
  q({
    slug: "czy-ip-box-na-ryczalcie",
    title: "Czy na ryczałcie można korzystać z IP BOX?",
    category: "podatki-przedsiebiorcy",
    answer:
      "Nie. Preferencja IP BOX jest w ustawie o PIT i nie przysługuje przy ryczałcie od przychodów ewidencjonowanych. Aby z niej skorzystać, trzeba rozliczać się na zasadach ogólnych lub podatkiem liniowym.",
    actions: ["Porównaj łączne obciążenia (podatek i składki) dla każdej formy.", "Sprawdź termin na zmianę formy opodatkowania."],
    sources: ["ipBoxObjasnienia"],
    relatedInstruction: "jak-placic-5-procent-podatku-jako-programista",
    relatedPath: "inne-formy",
  }),
  q({
    slug: "co-to-jest-wskaznik-nexus",
    title: "Co to jest wskaźnik nexus w IP BOX?",
    category: "podatki-przedsiebiorcy",
    answer:
      "To mnożnik, który określa, jaka część dochodu z kwalifikowanego IP może być opodatkowana stawką 5%. Wzór: (a + b) × 1,3 ÷ (a + b + c + d), maksymalnie 1. Liczy się go osobno dla każdego programu.",
    actions: ["Przypisuj koszty prac B+R do konkretnych programów w ewidencji.", "Oddziel koszty kupione od podmiotów powiązanych (c) i nabycie IP (d)."],
    explanation: "a – koszty własnych prac B+R, b – prace B+R od podmiotów niepowiązanych, c – prace B+R od podmiotów powiązanych, d – nabycie kwalifikowanego IP.",
    sources: ["ipBoxObjasnienia"],
    relatedInstruction: "jak-placic-5-procent-podatku-jako-programista",
    relatedPath: "rozliczenie",
  }),
  q({
    slug: "ile-kosztuje-zgloszenie-znaku-towarowego",
    title: "Ile kosztuje zgłoszenie znaku towarowego?",
    category: "ochrona-marki",
    answer:
      "W Urzędzie Patentowym RP zgłoszenie elektroniczne kosztuje 400 zł za jedną klasę i 120 zł za każdą kolejną (papierowe: 450 zł za jedną klasę). Po decyzji dochodzi opłata za okres ochrony. Znak UE w EUIPO: 850 EUR za jedną klasę online.",
    actions: ["Ustal, ile klas towarów i usług potrzebujesz.", "Sprawdź aktualną tabelę opłat przed wpłatą."],
    sources: ["uprpOplatyZgloszeniowe", "uprpOplatyOchrona", "euipoOplaty"],
    relatedInstruction: "jak-ochronic-marke",
    relatedPath: "zgloszenie-samodzielne",
  }),
  q({
    slug: "czy-wpis-do-ceidg-chroni-nazwe-firmy",
    title: "Czy wpis do CEIDG chroni nazwę firmy przed skopiowaniem?",
    category: "ochrona-marki",
    answer:
      "Nie w taki sposób jak znak towarowy. Wpis w CEIDG czy KRS albo zakup domeny nie daje wyłącznego prawa do używania nazwy jako marki dla towarów i usług. Taką ochronę daje rejestracja znaku towarowego.",
    actions: ["Sprawdź, czy nazwa nie jest już zgłoszona jako znak towarowy.", "Rozważ zgłoszenie znaku w UPRP lub EUIPO."],
    sources: ["uprpProcedura"],
    relatedInstruction: "jak-ochronic-marke",
    relatedPath: "sprawdz-nazwe",
  }),
  q({
    slug: "ile-czasu-na-sprzeciw-wobec-znaku-towarowego",
    title: "Ile mam czasu na sprzeciw wobec podobnego znaku towarowego?",
    category: "ochrona-marki",
    answer:
      "3 miesiące od ogłoszenia o zgłoszeniu znaku w Biuletynie Urzędu Patentowego. Termin nie podlega przywróceniu – sprzeciw złożony później nie zostanie rozpoznany.",
    actions: ["Regularnie sprawdzaj Biuletyn Urzędu Patentowego.", "Przygotuj dowody swoich wcześniejszych praw."],
    sources: ["uprpSprzeciw"],
    relatedInstruction: "jak-ochronic-marke",
    relatedPath: "monitoring",
  }),
  q({
    slug: "czy-mediacja-jest-obowiazkowa-przy-rozwodzie",
    title: "Czy mediacja jest obowiązkowa przy rozwodzie?",
    category: "rozwod-i-rodzina",
    answer:
      "Nie. Mediacja jest dobrowolna. Może się odbyć przed sprawą lub na skierowanie sądu. Mediacja nie rozwiązuje małżeństwa – rozwód orzeka sąd. Przy przemocy w rodzinie mediacja jest niewłaściwa.",
    actions: ["Jeśli chcecie spróbować – wybierzcie mediatora z listy sądu okręgowego.", "Spiszcie sprawy sporne przed pierwszym spotkaniem."],
    sources: ["govMediacje", "soGliwiceMediacjaPrzemoc", "mediacjaKoszty"],
    relatedInstruction: "jak-rozwiesc-sie-bez-konfliktu",
    relatedPath: "mediacja",
  }),
  q({
    slug: "ile-kosztuje-rozwod",
    title: "Ile kosztuje rozwód w sądzie?",
    category: "rozwod-i-rodzina",
    answer:
      "Opłata od pozwu o rozwód wynosi 600 zł. Gdy sąd orzeka rozwód na zgodny wniosek stron bez orzekania o winie, połowa opłaty (300 zł) wraca po uprawomocnieniu wyroku. Jeśli nie stać Cię na opłatę, możesz wnioskować o zwolnienie od kosztów.",
    actions: ["Wnieś opłatę 600 zł przy składaniu pozwu.", "Rozważ wniosek o zwolnienie od kosztów, jeśli to konieczne."],
    sources: ["soLodzOplata", "soWarszawaPragaZwrot", "soRzeszowPozew"],
    relatedInstruction: "jak-rozwiesc-sie-bez-konfliktu",
    relatedPath: "bez-winy",
  }),
  q({
    slug: "czy-mozna-wziac-rozwod-w-urzedzie",
    title: "Czy można wziąć rozwód w urzędzie stanu cywilnego?",
    category: "rozwod-i-rodzina",
    answer:
      "Nie. Rozwód orzeka wyłącznie sąd okręgowy. Projekt wprowadzenia rozwodu przed kierownikiem USC był procedowany w Sejmie, ale według doniesień prasowych został zawetowany i nie obowiązuje.",
    actions: ["Jeśli chcecie szybkiego rozwodu – przygotujcie zgodny pozew bez orzekania o winie.", "Śledź oficjalne komunikaty, jeśli prace nad zmianą zostaną wznowione."],
    sources: ["msRozwodUsc", "soLodzOplata"],
    relatedInstruction: "jak-rozwiesc-sie-bez-konfliktu",
    relatedPath: "bez-winy",
  }),
  q({
    slug: "ile-kosztuje-mediacja-rozwodowa",
    title: "Ile kosztuje mediacja przy rozwodzie?",
    category: "rozwod-i-rodzina",
    answer:
      "Gdy kieruje do niej sąd, w sprawach niemajątkowych mediator otrzymuje 150 zł za pierwsze posiedzenie i 100 zł za kolejne – łącznie nie więcej niż 450 zł, plus wydatki. W sprawach majątkowych: 1% wartości sporu (150–2000 zł). Mediacja prywatna ma ceny rynkowe.",
    actions: ["Zapytaj mediatora o koszty przed pierwszym spotkaniem.", "Ustalcie, kto ponosi koszty – zwykle po połowie."],
    sources: ["mediacjaKoszty"],
    relatedInstruction: "jak-rozwiesc-sie-bez-konfliktu",
    relatedPath: "mediacja",
  }),
  q({
    slug: "co-to-jest-sankcja-kredytu-darmowego",
    title: "Co to jest sankcja kredytu darmowego?",
    category: "kredyty-i-banki",
    answer:
      "To uprawnienie konsumenta: jeśli umowa kredytu konsumenckiego narusza określone przepisy ustawy, po złożeniu pisemnego oświadczenia zwracasz tylko kapitał – bez odsetek i innych kosztów. Uprawnienie wygasa po roku od wykonania umowy.",
    actions: ["Sprawdź, czy Twój kredyt jest kredytem konsumenckim do 255 550 zł.", "Zbierz umowę i formularz informacyjny.", "Pilnuj rocznego terminu."],
    explanation: "Nikt nie może zagwarantować, że sankcja przysługuje. W razie sporu decyduje sąd, a orzecznictwo bywa rozbieżne.",
    sources: ["rfSkdWebinar", "ustawaKredytKonsumencki", "soWarszawaSkdTermin"],
    relatedInstruction: "jak-sprawdzic-koszty-kredytu",
  }),
  q({
    slug: "czy-skd-dotyczy-kredytu-hipotecznego",
    title: "Czy sankcja kredytu darmowego dotyczy kredytu hipotecznego?",
    category: "kredyty-i-banki",
    answer:
      "Obecnie nie. Sankcja kredytu darmowego dotyczy umów o kredyt konsumencki, a w obecnym stanie prawnym nie obejmuje umów kredytu hipotecznego.",
    actions: ["Jeśli masz kredyt hipoteczny i wątpliwości co do umowy – potrzebna jest osobna analiza innych podstaw prawnych."],
    sources: ["rfSkdWebinar"],
    relatedInstruction: "jak-sprawdzic-koszty-kredytu",
    relatedPath: "czy-moj-kredyt",
  }),
  q({
    slug: "ile-dni-na-zwrot-towaru-kupionego-w-internecie",
    title: "Ile mam dni na zwrot towaru kupionego w internecie?",
    category: "umowy-i-konsumenci",
    answer:
      "14 dni od otrzymania towaru – bez podawania przyczyny. Jeśli sprzedawca nie poinformował Cię o tym prawie, termin wydłuża się o 12 miesięcy. Sprzedawca zwraca płatność w ciągu 14 dni od otrzymania Twojego oświadczenia.",
    actions: ["Wyślij sprzedawcy oświadczenie o odstąpieniu od umowy przed upływem 14 dni.", "Odeślij towar w ciągu 14 dni od odstąpienia.", "Zachowaj potwierdzenie wysłania oświadczenia i paczki."],
    explanation: "Prawo dotyczy umów zawartych na odległość (np. przez internet) i poza lokalem przedsiębiorstwa. Od niektórych umów nie można odstąpić – sprawdź wyjątki w regulaminie i na stronie UOKiK.",
    sources: ["uokikOdstapienie"],
    relatedInstruction: null,
  }),
  q({
    slug: "czy-jdg-moze-oglosic-upadlosc-konsumencka",
    title: "Czy osoba prowadząca JDG może ogłosić upadłość konsumencką?",
    category: "firma-w-trudnosciach",
    answer:
      "Dopóki prowadzisz działalność, stosuje się przepisy o upadłości przedsiębiorcy (i obowiązek złożenia wniosku w 30 dni). Upadłość konsumencka dotyczy osób nieprowadzących działalności. Po zakończeniu działalności co do zasady możesz z niej skorzystać, ale szczegóły wymagają indywidualnego sprawdzenia.",
    actions: ["Ustal datę niewypłacalności i stan wpisu w CEIDG.", "Porównaj restrukturyzację, upadłość przedsiębiorcy i – po zamknięciu firmy – upadłość konsumencką."],
    sources: ["prawoUpadlosciowe", "saKatowiceArt21"],
    relatedInstruction: "jak-wyjsc-z-dlugow-firmowych",
  }),
];
