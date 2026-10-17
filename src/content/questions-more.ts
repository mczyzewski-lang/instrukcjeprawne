import type { Question } from "@/lib/types";
import { q } from "./questions";

/**
 * Rozszerzona baza odpowiedzi (research 16–17.10.2026).
 * Wszystkie mają status „review” – wymagają zatwierdzenia przez prawnika w panelu.
 * Część zastępuje pytania z kolejki redakcyjnej (ten sam slug).
 */
export const MORE_QUESTIONS: Question[] = [
  /* ---------- Długi i komornik ---------- */
  q({
    slug: "czy-musze-placic-dlugi-zmarlego-rodzica",
    title: "Czy muszę spłacać długi zmarłego rodzica?",
    category: "dlugi-i-komornik",
    answer:
      "Nie zawsze. Masz 6 miesięcy od dnia, w którym dowiedziałeś/aś się, że jesteś spadkobiercą, na decyzję. Jeśli nic nie zrobisz, przyjmujesz spadek z dobrodziejstwem inwentarza – odpowiadasz za długi tylko do wartości majątku spadkowego. Możesz też spadek odrzucić.",
    actions: [
      "Zapisz datę, w której dowiedziałeś/aś się o śmierci i o tym, że dziedziczysz.",
      "Sprawdź, jakie długi i jaki majątek zostawił zmarły (pisma, konta, BIK za zgodą sądu lub z dokumentów).",
      "Jeśli długi przewyższają majątek – rozważ odrzucenie spadku przed sądem lub notariuszem w ciągu 6 miesięcy.",
      "Pamiętaj, że po Twoim odrzuceniu spadek może przejść na Twoje dzieci – one też muszą złożyć oświadczenie.",
    ],
    sources: ["govSpadek", "powrotySpadek"],
    relatedInstruction: null,
    relatedQuestions: ["jak-odrzucic-spadek-z-dlugami"],
  }),
  q({
    slug: "jak-odrzucic-spadek-z-dlugami",
    title: "Jak odrzucić spadek z długami?",
    category: "dlugi-i-komornik",
    answer:
      "Składasz oświadczenie o odrzuceniu spadku w sądzie rejonowym (sąd spadku lub sąd Twojego miejsca zamieszkania) albo u notariusza – w ciągu 6 miesięcy od dnia, w którym dowiedziałeś/aś się o powołaniu do spadku. Po odrzuceniu nie odpowiadasz za długi, ale tracisz też wszystkie składniki majątku spadkowego.",
    actions: [
      "Ustal datę, od której liczy się 6 miesięcy.",
      "Przygotuj akt zgonu i dane spadkodawcy.",
      "Złóż oświadczenie w sądzie lub u notariusza. Mieszkając za granicą – przez konsula.",
      "Jeśli masz małoletnie dzieci, które dziedziczą po Tobie, złóż w ich imieniu wniosek do sądu opiekuńczego o zgodę na odrzucenie.",
    ],
    explanation: "Gdy do odrzucenia w imieniu małoletniego potrzebna jest zgoda sądu opiekuńczego, termin biegnie dalej po uprawomocnieniu się tego orzeczenia. Szczegóły warto sprawdzić od razu, bo terminu nie da się łatwo przywrócić.",
    sources: ["govSpadek", "powrotySpadek"],
    relatedInstruction: null,
    relatedQuestions: ["czy-musze-placic-dlugi-zmarlego-rodzica"],
  }),
  q({
    slug: "czym-sie-rozni-uklad-konsumencki-od-upadlosci",
    title: "Czym różni się układ konsumencki od upadłości?",
    category: "dlugi-i-komornik",
    answer:
      "W układzie konsumenckim proponujesz wierzycielom nowe zasady spłaty, a oni głosują – Twój majątek nie jest sprzedawany. W upadłości syndyk przejmuje majątek i go sprzedaje, a sąd ustala plan spłaty; po jego wykonaniu pozostałe długi mogą zostać umorzone.",
    actions: [
      "Jeśli możesz spłacać część długów – sprawdź najpierw układ.",
      "Jeśli nie możesz spłacać nic – sprawdź upadłość.",
      "Porównaj skutki dla mieszkania i majątku rodziny przed wyborem.",
    ],
    sources: ["msPoradnikUpadlosc", "prawoUpadlosciowe"],
    relatedInstruction: "jak-wyjsc-z-dlugow",
    relatedPath: "uklad",
  }),
  q({
    slug: "czy-przedawniony-dlug-trzeba-splacic",
    title: "Czy przedawniony dług trzeba spłacić?",
    category: "dlugi-i-komornik",
    answer:
      "Po upływie przedawnienia wierzyciel nie może skutecznie dochodzić od konsumenta zapłaty w sądzie. Dług nie znika jednak całkiem – jeśli zapłacisz dobrowolnie, nie odzyskasz pieniędzy. Uznanie długu (np. podpisanie ugody) przed upływem terminu przerywa jego bieg.",
    actions: [
      "Sprawdź daty: od kiedy dług był wymagalny i czy coś przerwało bieg terminu.",
      "Nie podpisuj ugody ani uznania długu bez sprawdzenia skutków.",
      "Jeśli dostaniesz nakaz zapłaty – złóż sprzeciw w 2 tygodnie i podnieś przedawnienie.",
    ],
    sources: ["przedawnienie2018", "srKoscianTerminy"],
    relatedInstruction: "jak-wyjsc-z-dlugow",
    relatedPath: "weryfikacja",
    relatedQuestions: ["kiedy-dlug-sie-przedawnia"],
  }),
  q({
    slug: "co-zrobic-gdy-dostane-wezwanie-od-windykacji",
    title: "Co zrobić, gdy dostanę wezwanie od firmy windykacyjnej?",
    category: "dlugi-i-komornik",
    answer:
      "Nie płać od razu i nie ignoruj. Sprawdź, czy dług istnieje, czy jest Twój, czy kwota się zgadza i czy nie jest przedawniony. Firma windykacyjna nie ma uprawnień komornika – nie może niczego zająć bez wyroku i postępowania egzekucyjnego.",
    actions: [
      "Poproś na piśmie o dokumenty: umowę, wyliczenie kwoty i dowód nabycia długu.",
      "Sprawdź datę wymagalności i przedawnienie.",
      "Jeśli dług jest bezsporny – zaproponuj realny harmonogram spłaty na piśmie.",
      "Zachowuj korespondencję i potwierdzenia wpłat.",
    ],
    sources: ["przedawnienie2018"],
    relatedInstruction: "jak-wyjsc-z-dlugow",
    relatedPath: "weryfikacja",
    relatedQuestions: ["czy-bank-moze-sprzedac-moj-dlug", "czy-windykator-moze-przyjsc-do-domu"],
  }),
  q({
    slug: "czy-windykator-moze-przyjsc-do-domu",
    title: "Czy windykator może przyjść do mnie do domu?",
    category: "dlugi-i-komornik",
    answer:
      "Może przyjść porozmawiać, ale nie ma uprawnień komornika. Nie musisz go wpuszczać ani niczego mu wydawać. Nie może zająć Twoich rzeczy ani pieniędzy – to może zrobić tylko komornik na podstawie tytułu wykonawczego.",
    actions: [
      "Poproś o dokument potwierdzający, kogo reprezentuje i jakiego długu dotyczy wizyta.",
      "Rozmowy prowadź najlepiej na piśmie.",
      "Jeśli zachowanie jest nękające lub wprowadzające w błąd – zgłoś to wierzycielowi i np. rzecznikowi konsumentów.",
    ],
    sources: ["krajowaRadaKomornicza"],
    relatedInstruction: "jak-wyjsc-z-dlugow",
  }),
  q({
    slug: "jak-sprawdzic-czy-mam-dlugi",
    title: "Jak sprawdzić, czy mam jakieś długi?",
    category: "dlugi-i-komornik",
    answer:
      "Raz na 6 miesięcy możesz bezpłatnie pobrać kopię swoich danych z BIK (historia kredytów). Podobnie bezpłatny dostęp mają konsumenci w biurach informacji gospodarczej (np. KRD, BIG InfoMonitor). Sprawdź też Krajowy Rejestr Zadłużonych i korespondencję z sądu.",
    actions: [
      "Złóż w BIK wniosek o bezpłatną kopię danych (prawo dostępu z RODO).",
      "Sprawdź swoje dane w biurach informacji gospodarczej.",
      "Przejrzyj pisma od wierzycieli i z sądu z ostatnich lat.",
    ],
    sources: ["bikKopia", "krzPortal"],
    relatedInstruction: "jak-wyjsc-z-dlugow",
    relatedPath: "budzet",
  }),
  q({
    slug: "czy-komornik-moze-zajac-emeryture",
    title: "Czy komornik może zająć emeryturę lub rentę?",
    category: "dlugi-i-komornik",
    answer:
      "Może zająć część emerytury lub renty, ale nie całość. Przepisy przewidują kwotę wolną od egzekucji, która jest waloryzowana co roku od 1 marca i zależy od rodzaju długu. Przy alimentach można potrącić więcej niż przy innych długach.",
    actions: [
      "Sprawdź na odcinku z ZUS, ile i na rzecz kogo potrącono.",
      "Porównaj z aktualną kwotą wolną na stronie ZUS.",
      "Jeśli potrącenie jest zawyżone – złóż skargę na czynność komornika w tydzień.",
    ],
    sources: ["zusEmerytura", "srTorunSkarga"],
    relatedInstruction: "co-zrobic-gdy-komornik-zajal-konto",
    relatedPath: "kwota-wolna",
  }),
  q({
    slug: "czy-komornik-moze-zajac-konto-wspolne",
    title: "Czy komornik może zająć wspólne konto małżonków?",
    category: "dlugi-i-komornik",
    answer:
      "W praktyce tak – egzekucja z rachunku wspólnego bywa prowadzona także wtedy, gdy dług ma tylko jeden małżonek. Małżonek, który nie jest dłużnikiem, może się bronić w sądzie, np. powództwem o zwolnienie zajętych środków od egzekucji.",
    actions: [
      "Ustal, czyj to dług i czy drugi małżonek zgadzał się na jego zaciągnięcie.",
      "Zbierz dowody, z czego pochodzą pieniądze na koncie (np. wynagrodzenie małżonka).",
      "Skonsultuj szybko możliwość obrony – np. w punkcie nieodpłatnej pomocy prawnej.",
    ],
    sources: ["iwsMalzonek", "prawoBankowe54"],
    relatedInstruction: "co-zrobic-gdy-komornik-zajal-konto",
    relatedQuestions: ["czy-dlugi-przechodza-na-wspolmalzonka"],
  }),
  q({
    slug: "jak-napisac-wniosek-o-rozlozenie-dlugu-na-raty",
    title: "Jak napisać wniosek o rozłożenie długu na raty?",
    category: "dlugi-i-komornik",
    answer:
      "Krótko i konkretnie: kto pisze, jakiego długu dotyczy (numer umowy lub sprawy), dlaczego nie możesz zapłacić jednorazowo i jaką ratę proponujesz od kiedy. Wyślij go tak, żeby mieć dowód nadania, i poproś o odpowiedź na piśmie.",
    actions: [
      "Policz realną ratę na podstawie budżetu.",
      "Napisz wniosek: dane, numer umowy, przyczyna, propozycja (kwota, dzień płatności, liczba rat).",
      "Dołącz dokumenty potwierdzające sytuację (np. utratę pracy).",
      "Nie podpisuj ugody bez sprawdzenia, czy nie uznajesz długu przedawnionego.",
    ],
    sources: ["prawoBankowe75c", "przedawnienie2018"],
    relatedInstruction: "jak-wyjsc-z-dlugow",
    relatedPath: "negocjacje",
  }),
  q({
    slug: "co-to-jest-tytul-wykonawczy",
    title: "Co to jest tytuł wykonawczy i klauzula wykonalności?",
    category: "dlugi-i-komornik",
    answer:
      "Tytuł wykonawczy to dokument, na podstawie którego komornik może prowadzić egzekucję – najczęściej wyrok lub nakaz zapłaty z klauzulą wykonalności nadaną przez sąd. Bez tytułu wykonawczego nikt nie może legalnie zająć Twojego konta czy pensji w egzekucji sądowej.",
    actions: [
      "Zapytaj komornika, jaki tytuł wykonawczy jest podstawą egzekucji (sąd, sygnatura, data).",
      "Sprawdź, czy wiedziałeś/aś o sprawie sądowej i czy pisma były doręczone na właściwy adres.",
    ],
    sources: ["srKoscianTerminy", "krajowaRadaKomornicza"],
    relatedInstruction: "co-zrobic-gdy-komornik-zajal-konto",
    relatedPath: "nieznany-dlug",
  }),
  q({
    slug: "co-zrobic-gdy-nakaz-przyszedl-na-stary-adres",
    title: "Co zrobić, gdy nakaz zapłaty przyszedł na stary adres?",
    category: "dlugi-i-komornik",
    answer:
      "Liczą się dni. Jeśli nie odebrałeś/aś nakazu bez swojej winy, możesz złożyć wniosek o przywrócenie terminu – w ciągu tygodnia od dnia, w którym dowiedziałeś/aś się o sprawie – i jednocześnie złożyć sprzeciw. W niektórych sytuacjach doręczenie może być w ogóle nieskuteczne – to wymaga sprawdzenia akt.",
    actions: [
      "Ustal sygnaturę sprawy i sprawdź w sądzie, na jaki adres wysłano nakaz.",
      "Zbierz dowody, gdzie mieszkałeś/aś (umowa najmu, meldunek, korespondencja).",
      "W ciągu 7 dni złóż wniosek o przywrócenie terminu razem ze sprzeciwem.",
      "Jeśli możesz – od razu skonsultuj pismo w punkcie nieodpłatnej pomocy prawnej.",
    ],
    sources: ["przywrocenieTerminu", "srKoscianTerminy", "nieodplatnaPomoc"],
    relatedInstruction: "co-zrobic-gdy-komornik-zajal-konto",
    relatedPath: "nieznany-dlug",
  }),
  q({
    slug: "czy-oszusci-podszywaja-sie-pod-komornika",
    title: "Jak rozpoznać fałszywe pismo od komornika?",
    category: "dlugi-i-komornik",
    answer:
      "Prawdziwe pismo ma imię i nazwisko komornika, sąd rejonowy, przy którym działa, sygnaturę sprawy (z literami „Km”) i dane wierzyciela. Kancelarię sprawdzisz w wyszukiwarce Krajowej Rady Komorniczej. Uważaj na SMS-y i e-maile z linkiem do „szybkiej płatności”.",
    actions: [
      "Sprawdź kancelarię w wyszukiwarce komorników.",
      "Zadzwoń do kancelarii na numer znaleziony samodzielnie – nie z pisma.",
      "Nie płać przez link z wiadomości i nie podawaj danych do logowania do banku.",
    ],
    sources: ["krajowaRadaKomornicza"],
    relatedInstruction: "co-zrobic-gdy-komornik-zajal-konto",
  }),
  q({
    slug: "czy-wierzyciel-moze-dzwonic-do-pracodawcy",
    title: "Czy wierzyciel może dzwonić do mojego pracodawcy lub rodziny?",
    category: "dlugi-i-komornik",
    answer:
      "Wierzyciel może się z Tobą kontaktować, ale informowanie innych osób o Twoim długu może naruszać Twoje dobra osobiste i przepisy o ochronie danych. Pracodawca dowiaduje się o długu oficjalnie dopiero wtedy, gdy komornik zajmie wynagrodzenie.",
    actions: [
      "Poproś wierzyciela na piśmie o kontakt wyłącznie z Tobą.",
      "Zapisuj daty i treść telefonów do osób trzecich.",
      "Przy uporczywym nękaniu zgłoś sprawę wierzycielowi, rzecznikowi konsumentów lub do UODO.",
    ],
    sources: ["uokik"],
    relatedInstruction: "jak-wyjsc-z-dlugow",
  }),
  q({
    slug: "czy-chwilowke-mozna-nie-splacac",
    title: "Czy można nie spłacać chwilówki z bardzo wysokimi kosztami?",
    category: "dlugi-i-komornik",
    answer:
      "Nie warto przestawać płacić na własną rękę. Jeśli jednak umowa pożyczki narusza przepisy ustawy o kredycie konsumenckim, możliwa może być sankcja kredytu darmowego – oddajesz wtedy tylko pożyczony kapitał. To wymaga sprawdzenia umowy i ma termin.",
    actions: [
      "Zbierz umowę, formularz informacyjny i historię spłat.",
      "Sprawdź, czy koszty i RRSO są poprawnie podane.",
      "Pilnuj terminu: rok od wykonania umowy.",
    ],
    sources: ["rfSkdWebinar", "ustawaKredytKonsumencki"],
    relatedInstruction: "jak-sprawdzic-koszty-kredytu",
    relatedQuestions: ["co-to-jest-sankcja-kredytu-darmowego"],
  }),
  q({
    slug: "czy-mozna-oglosic-upadlosc-drugi-raz",
    title: "Czy można ogłosić upadłość konsumencką drugi raz?",
    category: "dlugi-i-komornik",
    answer:
      "Co do zasady sąd oddali wniosek, jeśli w ciągu 10 lat wcześniej prowadzono wobec Ciebie upadłość, w której umorzono całość lub część długów. Wyjątek jest możliwy, gdy przemawiają za tym względy słuszności lub humanitarne.",
    actions: [
      "Sprawdź datę zakończenia poprzedniej upadłości.",
      "Jeśli minęło mniej niż 10 lat – rozważ układ konsumencki lub negocjacje.",
    ],
    sources: ["prawoUpadlosciowe", "msPoradnikUpadlosc"],
    relatedInstruction: "jak-wyjsc-z-dlugow",
    relatedPath: "upadlosc",
  }),

  /* ---------- Firma ---------- */
  q({
    slug: "czy-zus-rozlozy-zaleglosci-na-raty",
    title: "Czy ZUS rozłoży zaległości na raty?",
    category: "firma-w-trudnosciach",
    answer:
      "Może – na Twój wniosek, jeśli uzasadnisz trudną sytuację i będziesz opłacać bieżące składki. Zamiast odsetek płacisz niższą opłatę prolongacyjną. Samo złożenie wniosku nie wstrzymuje egzekucji – dopiero podpisanie umowy ratalnej.",
    actions: [
      "Złóż wniosek RSR przez PUE ZUS, pocztą lub w placówce.",
      "Opisz przyczynę problemów i zaproponuj liczbę rat.",
      "Opłacaj bieżące składki – to zwykle warunek ulgi.",
      "Przygotuj informacje o otrzymanej pomocy publicznej (de minimis).",
    ],
    sources: ["zusRaty"],
    relatedInstruction: "jak-wyjsc-z-dlugow-firmowych",
    relatedPath: "porozumienie",
  }),
  q({
    slug: "czy-urzad-skarbowy-rozlozy-podatek-na-raty",
    title: "Czy urząd skarbowy rozłoży zaległy podatek na raty?",
    category: "firma-w-trudnosciach",
    answer:
      "Może – na wniosek, gdy przemawia za tym Twój ważny interes lub interes publiczny. Decyzja jest uznaniowa. Wniosek jest bezpłatny, a urząd ma na odpowiedź miesiąc (w trudniejszych sprawach dwa). Od rozłożonej kwoty płacisz opłatę prolongacyjną.",
    actions: [
      "Złóż wniosek (np. formularz RAT-Z dla przedsiębiorców) do swojego urzędu skarbowego.",
      "Wskaż, które należności, w jakiej kwocie i na ile rat chcesz rozłożyć.",
      "Udokumentuj sytuację finansową.",
      "Pilnuj terminów rat – niezapłacenie kilku rat może spowodować wygaśnięcie decyzji.",
    ],
    sources: ["biznesRatyPodatek"],
    relatedInstruction: "jak-wyjsc-z-dlugow-firmowych",
    relatedPath: "porozumienie",
  }),
  q({
    slug: "czy-po-zamknieciu-jdg-dlugi-znikaja",
    title: "Czy po zamknięciu JDG długi firmy znikają?",
    category: "firma-w-trudnosciach",
    answer:
      "Nie. W jednoosobowej działalności to Ty jesteś dłużnikiem – wykreślenie firmy z CEIDG nie zmienia tego, że długi trzeba spłacić. Po zamknięciu działalności zmieniają się jednak dostępne procedury, np. możliwość skorzystania z rozwiązań dla konsumentów.",
    actions: [
      "Spisz wszystkie długi firmy, także wobec ZUS i urzędu skarbowego.",
      "Przed zamknięciem firmy sprawdź obowiązek złożenia wniosku o upadłość (30 dni od niewypłacalności).",
      "Porównaj restrukturyzację, upadłość przedsiębiorcy i – po zamknięciu – rozwiązania konsumenckie.",
    ],
    sources: ["prawoUpadlosciowe", "saKatowiceArt21"],
    relatedInstruction: "jak-wyjsc-z-dlugow-firmowych",
    relatedPath: "odpowiedzialnosc",
  }),
  q({
    slug: "czy-restrukturyzacja-wstrzymuje-komornika",
    title: "Czy restrukturyzacja wstrzymuje komornika?",
    category: "firma-w-trudnosciach",
    answer:
      "W postępowaniu o zatwierdzenie układu – tak, od dnia obwieszczenia w Krajowym Rejestrze Zadłużonych toczące się egzekucje są zawieszane. Ochrona wygasa, jeśli w ciągu 4 miesięcy nie złożysz wniosku o zatwierdzenie układu. Inne postępowania restrukturyzacyjne mają własne zasady ochrony.",
    actions: ["Wybierz nadzorcę układu.", "Przygotuj propozycje układowe przed obwieszczeniem.", "Zaplanuj zebranie głosów w 4 miesiące."],
    sources: ["parpOchrona", "prawoRestrukturyzacyjne"],
    relatedInstruction: "jak-wyjsc-z-dlugow-firmowych",
    relatedPath: "pzu",
  }),
  q({
    slug: "czy-wspolnik-spolki-z-oo-odpowiada-za-dlugi",
    title: "Czy wspólnik spółki z o.o. odpowiada za jej długi?",
    category: "firma-w-trudnosciach",
    answer:
      "Co do zasady nie – za długi spółki z o.o. odpowiada spółka swoim majątkiem, a wspólnik ryzykuje wniesionymi udziałami. Inaczej jest, gdy wspólnik jest też członkiem zarządu (odpowiedzialność za spóźniony wniosek o upadłość) albo osobiście poręczył długi spółki.",
    actions: [
      "Sprawdź, czy pełnisz funkcję w zarządzie.",
      "Sprawdź umowy kredytów i leasingów pod kątem Twoich poręczeń i weksli.",
    ],
    sources: ["saKatowiceArt21"],
    relatedInstruction: "jak-wyjsc-z-dlugow-firmowych",
    relatedPath: "odpowiedzialnosc",
    relatedQuestions: ["czy-czlonek-zarzadu-odpowiada-za-dlugi-spolki"],
  }),
  q({
    slug: "jak-odzyskac-pieniadze-od-klienta-ktory-nie-placi",
    title: "Jak odzyskać pieniądze od klienta, który nie płaci faktury?",
    category: "firma-w-trudnosciach",
    answer:
      "Zacznij od przypomnienia i wezwania do zapłaty z terminem. Jeśli to nie działa – możesz złożyć pozew, także w elektronicznym postępowaniu upominawczym. W transakcjach między firmami przysługują Ci odsetki za opóźnienie i ryczałtowa rekompensata kosztów odzyskiwania należności (co najmniej równowartość 40 euro).",
    actions: [
      "Wyślij wezwanie do zapłaty z konkretnym terminem.",
      "Policz odsetki i rekompensatę za koszty odzyskiwania należności.",
      "Rozważ pozew w EPU (e-sąd) – dla prostych, udokumentowanych roszczeń.",
      "Pilnuj przedawnienia: roszczenia związane z działalnością gospodarczą przedawniają się po 3 latach.",
    ],
    explanation: "Wysokość rekompensaty zależy od kwoty należności – przy wyższych kwotach jest wyższa. Sprawdź aktualne progi w ustawie o przeciwdziałaniu nadmiernym opóźnieniom w transakcjach handlowych.",
    sources: ["msEpu", "przedawnienie2018"],
    relatedInstruction: "jak-wyjsc-z-dlugow-firmowych",
    relatedPath: "naprawa",
  }),
  q({
    slug: "kto-moze-byc-nadzorca-ukladu",
    title: "Kto może być nadzorcą układu?",
    category: "firma-w-trudnosciach",
    answer:
      "Licencjonowany doradca restrukturyzacyjny. W postępowaniu o zatwierdzenie układu wybierasz go sam i zawierasz z nim umowę – w niej ustalacie także wynagrodzenie. Nadzorca prowadzi postępowanie i pomaga przygotować dokumenty.",
    actions: ["Poproś kilku doradców o ofertę z zakresem prac i wynagrodzeniem.", "Zapytaj o doświadczenie w podobnych firmach."],
    sources: ["parpOchrona", "parpPoradnik"],
    relatedInstruction: "jak-wyjsc-z-dlugow-firmowych",
    relatedPath: "pzu",
  }),
  q({
    slug: "czym-rozni-sie-sanacja-od-ukladu",
    title: "Czym różni się sanacja od postępowania układowego?",
    category: "firma-w-trudnosciach",
    answer:
      "Sanacja to najgłębsza forma restrukturyzacji – oprócz układu z wierzycielami pozwala przeprowadzić działania naprawcze, np. odstąpić od niektórych niekorzystnych umów. Zwykle wiąże się z przejęciem zarządu przez zarządcę. Postępowanie układowe skupia się na zawarciu układu.",
    actions: ["Oceń, czy problemem są tylko długi, czy także niekorzystne umowy i struktura firmy.", "Porównaj postępowania z doradcą restrukturyzacyjnym."],
    sources: ["parpPostepowania", "prawoRestrukturyzacyjne"],
    relatedInstruction: "jak-wyjsc-z-dlugow-firmowych",
    relatedPath: "inne-restrukturyzacje",
  }),

  /* ---------- Podatki ---------- */
  q({
    slug: "jak-prowadzic-ewidencje-ip-box",
    title: "Jak prowadzić ewidencję IP BOX w praktyce?",
    category: "podatki-przedsiebiorcy",
    answer:
      "Osobno dla każdego programu (kwalifikowanego IP): przypisuj do niego przychody z faktur, koszty prac badawczo-rozwojowych i dokumentuj czas pracy. Ewidencja musi pozwolić policzyć dochód z każdego IP i wskaźnik nexus.",
    actions: [
      "Załóż arkusz dla każdego programu lub modułu.",
      "Przy każdej fakturze zapisz, jaka część dotyczy praw do konkretnego programu.",
      "Koszty dziel na grupy potrzebne do wskaźnika nexus.",
      "Archiwizuj opisy zadań i historię prac (np. repozytorium).",
    ],
    sources: ["ipBoxObjasnienia"],
    relatedInstruction: "jak-placic-5-procent-podatku-jako-programista",
    relatedPath: "ewidencja",
  }),
  q({
    slug: "czy-ip-box-a-umowa-z-pracodawca-na-b2b",
    title: "Jak zapisać prawa autorskie w umowie B2B, żeby skorzystać z IP BOX?",
    category: "podatki-przedsiebiorcy",
    answer:
      "Umowa powinna jasno określać, że przenosisz autorskie prawa majątkowe do programu (albo udzielasz licencji) i jaka część wynagrodzenia przypada na te prawa. Zapisy muszą odpowiadać temu, jak naprawdę wygląda Twoja praca.",
    actions: [
      "Sprawdź, czy umowa w ogóle reguluje prawa autorskie do kodu.",
      "Ustal z klientem zapis o wynagrodzeniu za przeniesienie praw lub licencję.",
      "Rozważ interpretację indywidualną przed rozliczeniem.",
    ],
    sources: ["ipBoxObjasnienia", "interpretacjaIndywidualna"],
    relatedInstruction: "jak-placic-5-procent-podatku-jako-programista",
    relatedPath: "kwalifikacja",
  }),
  q({
    slug: "czy-ip-box-dla-testera",
    title: "Czy tester oprogramowania może skorzystać z IP BOX?",
    category: "podatki-przedsiebiorcy",
    answer:
      "To zależy od tego, co faktycznie robisz. Preferencja dotyczy dochodu z praw do programu, który tworzysz, rozwijasz lub ulepszasz w ramach działalności B+R. Samo wykonywanie testów zwykle trudno uznać za tworzenie programu – ale np. pisanie własnego kodu narzędzi testowych może być inną sytuacją.",
    actions: ["Opisz dokładnie swoje zadania i ich efekt (czy powstaje kod).", "Sprawdź podobne interpretacje w bazie Eureka.", "Przy wątpliwościach wystąp o interpretację indywidualną."],
    sources: ["ipBoxObjasnienia", "eureka"],
    relatedInstruction: "jak-placic-5-procent-podatku-jako-programista",
    relatedPath: "kwalifikacja",
  }),
  q({
    slug: "czy-urzad-moze-zakwestionowac-ip-box",
    title: "Czy urząd może zakwestionować IP BOX po kilku latach?",
    category: "podatki-przedsiebiorcy",
    answer:
      "Tak – w ramach kontroli urząd może badać rozliczenie, dopóki zobowiązanie podatkowe się nie przedawni. Najczęściej sprawdzany jest charakter prac B+R, umowy i ewidencja. Interpretacja indywidualna zgodna z rzeczywistością daje ochronę.",
    actions: ["Przechowuj ewidencję i dokumentację prac.", "Pilnuj, by umowy odpowiadały rzeczywistości.", "Rozważ interpretację indywidualną."],
    sources: ["ipBoxObjasnienia", "interpretacjaIndywidualna"],
    relatedInstruction: "jak-placic-5-procent-podatku-jako-programista",
    relatedPath: "interpretacja",
  }),

  /* ---------- Ochrona marki ---------- */
  q({
    slug: "czy-logo-i-nazwe-zglaszac-osobno",
    title: "Czy nazwę i logo zgłaszać jako osobne znaki?",
    category: "ochrona-marki",
    answer:
      "To zależy od budżetu i planów. Znak słowny chroni samą nazwę niezależnie od wyglądu. Znak słowno-graficzny chroni nazwę w konkretnej formie graficznej. Jeśli zmienisz logo, znak słowny nadal Cię chroni – dlatego przy jednym zgłoszeniu często wybiera się nazwę.",
    actions: ["Ustal, co jest najważniejsze dla rozpoznawalności marki.", "Porównaj koszty dwóch zgłoszeń.", "Sprawdź, czy nazwa jest wystarczająco odróżniająca się, by chronić ją jako znak słowny."],
    sources: ["uprpOplatyZgloszeniowe", "uprpProcedura"],
    relatedInstruction: "jak-ochronic-marke",
    relatedPath: "zgloszenie-samodzielne",
  }),
  q({
    slug: "co-zrobic-gdy-ktos-zarejestrowal-moja-nazwe",
    title: "Co zrobić, gdy ktoś zgłosił moją nazwę jako znak towarowy?",
    category: "ochrona-marki",
    answer:
      "Jeśli zgłoszenie jest świeże – masz 3 miesiące od jego ogłoszenia w Biuletynie Urzędu Patentowego na sprzeciw. Sprzeciw może wnieść m.in. właściciel wcześniejszego znaku lub wcześniejszego prawa. Gdy znak jest już zarejestrowany, potrzebne są inne środki, np. wniosek o unieważnienie.",
    actions: ["Sprawdź datę ogłoszenia zgłoszenia w BUP.", "Zbierz dowody wcześniejszego używania nazwy i swoich praw.", "Rozważ pomoc rzecznika patentowego – terminu sprzeciwu nie da się przywrócić."],
    sources: ["uprpSprzeciw"],
    relatedInstruction: "jak-ochronic-marke",
    relatedPath: "naruszenie",
  }),
  q({
    slug: "czy-mozna-uzywac-symbolu-r",
    title: "Kiedy mogę używać symbolu ® przy nazwie?",
    category: "ochrona-marki",
    answer:
      "Symbol ® oznacza znak zarejestrowany. Używaj go dopiero po uzyskaniu prawa ochronnego i tylko na terytorium oraz dla towarów i usług, dla których znak jest zarejestrowany. Używanie ® przy niezarejestrowanej nazwie może wprowadzać w błąd.",
    actions: ["Sprawdź status znaku w bazie UPRP lub EUIPO.", "Do czasu rejestracji nie używaj ®."],
    sources: ["uprpProcedura"],
    relatedInstruction: "jak-ochronic-marke",
  }),
  q({
    slug: "czy-znak-unijny-chroni-w-polsce",
    title: "Czy znak towarowy UE chroni markę także w Polsce?",
    category: "ochrona-marki",
    answer:
      "Tak. Znak towarowy Unii Europejskiej, zarejestrowany w EUIPO, chroni markę we wszystkich krajach UE, w tym w Polsce. Zgłoszenie online kosztuje 850 EUR za pierwszą klasę.",
    actions: ["Sprawdź nazwę w bazach całej UE (np. TMview).", "Porównaj koszt z ochroną tylko w Polsce."],
    sources: ["euipoOplaty"],
    relatedInstruction: "jak-ochronic-marke",
    relatedPath: "znak-ue",
  }),
  q({
    slug: "czy-domena-chroni-marke",
    title: "Czy zakup domeny chroni moją markę?",
    category: "ochrona-marki",
    answer:
      "Nie. Domena daje Ci adres internetowy, ale nie wyłączne prawo do nazwy jako marki. Inna firma może zarejestrować podobny znak towarowy, a w sporze to znak towarowy ma zwykle większe znaczenie.",
    actions: ["Sprawdź nazwę w bazach znaków towarowych.", "Rozważ zgłoszenie znaku towarowego."],
    sources: ["uprpProcedura"],
    relatedInstruction: "jak-ochronic-marke",
    relatedQuestions: ["czy-wpis-do-ceidg-chroni-nazwe-firmy"],
  }),
  q({
    slug: "jak-wybrac-klasy-nicejskie",
    title: "Jak wybrać klasy towarów i usług przy zgłoszeniu znaku?",
    category: "ochrona-marki",
    answer:
      "Wypisz konkretne towary i usługi, które oferujesz lub realnie planujesz oferować, i przypisz je do klas klasyfikacji nicejskiej. Znak chroni Cię tylko w zakresie wskazanych towarów i usług. Każda dodatkowa klasa podnosi opłaty.",
    actions: ["Opisz ofertę konkretnymi słowami.", "Skorzystaj z wyszukiwarek terminów w UPRP lub EUIPO.", "Nie dodawaj klas „na zapas” bez planów."],
    sources: ["uprpOplatyZgloszeniowe", "uprpOplatyOchrona"],
    relatedInstruction: "jak-ochronic-marke",
    relatedPath: "klasy",
  }),

  /* ---------- Rozwód i rodzina ---------- */
  q({
    slug: "jak-napisac-pozew-o-rozwod",
    title: "Jak napisać pozew o rozwód?",
    category: "rozwod-i-rodzina",
    answer:
      "Pozew składasz do sądu okręgowego. Podajesz dane stron, żądanie (rozwód z orzeczeniem o winie albo bez), opis rozkładu pożycia oraz wnioski dotyczące dzieci, mieszkania i ewentualnie alimentów. Dołączasz odpis aktu małżeństwa, akty urodzenia dzieci i dowód opłaty 600 zł.",
    actions: [
      "Pobierz odpis zupełny aktu małżeństwa i aktów urodzenia dzieci.",
      "Opisz krótko, od kiedy i dlaczego nie łączy Was więź.",
      "Dołącz porozumienie lub plan wychowawczy, jeśli go macie.",
      "Wnieś opłatę 600 zł lub złóż wniosek o zwolnienie od kosztów.",
    ],
    sources: ["soLodzOplata", "soRzeszowPozew"],
    relatedInstruction: "jak-rozwiesc-sie-bez-konfliktu",
    relatedPath: "bez-winy",
  }),
  q({
    slug: "co-to-jest-plan-wychowawczy",
    title: "Co to jest plan wychowawczy i jak go przygotować?",
    category: "rozwod-i-rodzina",
    answer:
      "To pisemne porozumienie rodziców o tym, jak po rozwodzie będą wykonywać władzę rodzicielską i kontakty z dzieckiem: gdzie dziecko mieszka, kiedy widuje drugiego rodzica, jak dzielicie ważne decyzje i koszty. Sąd uwzględnia je, jeśli jest zgodne z dobrem dziecka.",
    actions: [
      "Ustalcie miejsce zamieszkania dziecka i grafik kontaktów (dni, wakacje, święta).",
      "Zapiszcie, jak podejmujecie decyzje o szkole i leczeniu.",
      "Ustalcie podział kosztów utrzymania.",
      "Jeśli trudno Wam się porozumieć – skorzystajcie z mediacji.",
    ],
    sources: ["govMediacje"],
    relatedInstruction: "jak-rozwiesc-sie-bez-konfliktu",
    relatedPath: "porozumienie",
  }),
  q({
    slug: "jak-ustalic-wysokosc-alimentow",
    title: "Jak sąd ustala wysokość alimentów na dziecko?",
    category: "rozwod-i-rodzina",
    answer:
      "Sąd bierze pod uwagę dwie rzeczy: usprawiedliwione potrzeby dziecka oraz możliwości zarobkowe i majątkowe rodzica – nie tylko to, ile faktycznie zarabia, ale ile mógłby zarabiać. Nie ma jednej tabeli alimentów.",
    actions: [
      "Spisz miesięczne koszty dziecka: mieszkanie, jedzenie, szkoła, leczenie, zajęcia.",
      "Zbierz rachunki i paragony.",
      "Przygotuj informacje o dochodach obojga rodziców.",
    ],
    sources: ["soLodzOplata"],
    relatedInstruction: "jak-rozwiesc-sie-bez-konfliktu",
    relatedPath: "dzieci",
  }),
  q({
    slug: "czy-po-rozwodzie-mozna-zmienic-alimenty",
    title: "Czy po rozwodzie można zmienić wysokość alimentów?",
    category: "rozwod-i-rodzina",
    answer:
      "Tak – gdy zmienią się okoliczności: wzrosną potrzeby dziecka (np. szkoła, leczenie) albo istotnie zmienią się możliwości zarobkowe rodzica. Składa się wtedy pozew o podwyższenie lub obniżenie alimentów.",
    actions: ["Udokumentuj zmianę sytuacji od ostatniego orzeczenia.", "Zbierz aktualne rachunki i dokumenty o dochodach.", "Rozważ wcześniej porozumienie lub mediację."],
    sources: ["govMediacje"],
    relatedInstruction: "jak-rozwiesc-sie-bez-konfliktu",
    relatedPath: "dzieci",
  }),
  q({
    slug: "czym-rozni-sie-separacja-od-rozwodu",
    title: "Czym różni się separacja od rozwodu?",
    category: "rozwod-i-rodzina",
    answer:
      "Separacja nie rozwiązuje małżeństwa – nie możecie zawrzeć nowego związku małżeńskiego, ale skutki są podobne do rozwodu (m.in. rozdzielność majątkowa). Separację można później znieść. Pozew o separację kosztuje 600 zł, a wniosek o separację na zgodne żądanie małżonków bez wspólnych małoletnich dzieci – 100 zł.",
    actions: ["Zastanówcie się, czy chcecie zostawić możliwość powrotu.", "Sprawdźcie, czy możecie złożyć zgodny wniosek (tańszy, w trybie nieprocesowym)."],
    sources: ["separacjaOplaty", "soLodzOplata"],
    relatedInstruction: "jak-rozwiesc-sie-bez-konfliktu",
  }),
  q({
    slug: "czy-mozna-rozwiesc-sie-bez-zgody-meza-lub-zony",
    title: "Czy można się rozwieść bez zgody męża lub żony?",
    category: "rozwod-i-rodzina",
    answer:
      "Tak. Sąd orzeka rozwód, jeśli rozkład pożycia jest zupełny i trwały – zgoda drugiej strony nie jest konieczna. Wyjątek: gdy rozwodu żąda małżonek wyłącznie winny rozkładu, a drugi się nie zgadza – co do zasady sąd rozwodu nie orzeknie. Sąd nie orzeknie też rozwodu, jeśli ucierpiałoby na tym dobro wspólnych małoletnich dzieci.",
    actions: ["Zbierz rzeczowe dowody rozkładu pożycia.", "Rozważ mediację przynajmniej w sprawach dzieci.", "Przygotuj się na dłuższe postępowanie."],
    sources: ["soLodzOplata"],
    relatedInstruction: "jak-rozwiesc-sie-bez-konfliktu",
    relatedPath: "brak-zgody",
  }),
  q({
    slug: "co-z-mieszkaniem-na-kredyt-po-rozwodzie",
    title: "Co z mieszkaniem na wspólny kredyt po rozwodzie?",
    category: "rozwod-i-rodzina",
    answer:
      "Rozwód nie zmienia umowy z bankiem – jeśli oboje jesteście kredytobiorcami, bank może żądać spłaty od każdego z Was. Możliwe rozwiązania to m.in. sprzedaż mieszkania, przejęcie go przez jedną osobę ze spłatą drugiej (zwykle za zgodą banku na zwolnienie z długu) albo wspólne spłacanie.",
    actions: ["Sprawdź wartość mieszkania i saldo kredytu.", "Zapytaj bank o warunki zwolnienia jednej osoby z kredytu.", "Ustalcie podział w umowie o podział majątku."],
    sources: ["soLodzOplata"],
    relatedInstruction: "jak-rozwiesc-sie-bez-konfliktu",
    relatedPath: "majatek",
  }),
  q({
    slug: "czy-rozdzielnosc-majatkowa-chroni-przed-dlugami",
    title: "Czy rozdzielność majątkowa chroni przed długami współmałżonka?",
    category: "rozwod-i-rodzina",
    answer:
      "Chroni co do zasady na przyszłość – od jej ustanowienia każdy odpowiada za swoje nowe długi własnym majątkiem. Wobec wierzyciela umowa działa jednak tylko wtedy, gdy wierzyciel o niej wiedział. Nie usuwa też odpowiedzialności za długi zaciągnięte wcześniej.",
    actions: ["Poinformuj wierzycieli (np. bank) o zawarciu umowy majątkowej.", "Zachowaj dowód tej informacji.", "Sprawdź, które długi powstały przed umową."],
    sources: ["iwsMalzonek"],
    relatedInstruction: "jak-wyjsc-z-dlugow",
    relatedQuestions: ["czy-dlugi-przechodza-na-wspolmalzonka"],
  }),
  q({
    slug: "jak-znalezc-mediatora-rodzinnego",
    title: "Jak znaleźć mediatora rodzinnego?",
    category: "rozwod-i-rodzina",
    answer:
      "Listy stałych mediatorów prowadzą sądy okręgowe – znajdziesz je na ich stronach. Możesz też wybrać mediatora prywatnie. Bezpłatna mediacja jest dostępna także w niektórych punktach nieodpłatnej pomocy prawnej.",
    actions: ["Sprawdź listę mediatorów na stronie sądu okręgowego.", "Zapytaj o doświadczenie w sprawach rodzinnych i o koszty.", "Przy przemocy w rodzinie nie korzystaj z mediacji."],
    sources: ["govMediacje", "nieodplatnaPomoc", "soGliwiceMediacjaPrzemoc"],
    relatedInstruction: "jak-rozwiesc-sie-bez-konfliktu",
    relatedPath: "mediacja",
  }),
  q({
    slug: "gdzie-szukac-pomocy-przy-przemocy-domowej",
    title: "Gdzie szukać pomocy, gdy doświadczasz przemocy domowej?",
    category: "rozwod-i-rodzina",
    answer:
      "Całodobowo i bezpłatnie: Pogotowie „Niebieska Linia” – 800 120 002. W sytuacji zagrożenia dzwoń pod 112. Pomoc dostępna jest również dla świadków przemocy. W sprawie rozwodowej poinformuj sąd o przemocy – mediacja nie będzie wtedy właściwa.",
    actions: ["W zagrożeniu – 112.", "Zadzwoń pod 800 120 002.", "Zachowuj dokumentację (obdukcje, wiadomości, zgłoszenia na policję)."],
    sources: ["niebieskaLinia", "soGliwiceMediacjaPrzemoc"],
    relatedInstruction: "jak-rozwiesc-sie-bez-konfliktu",
    relatedPath: "przemoc",
  }),

  /* ---------- Kredyty i banki ---------- */
  q({
    slug: "jak-dziala-wczesniejsza-splata-kredytu",
    title: "Czy przy wcześniejszej spłacie kredytu bank oddaje część prowizji?",
    category: "kredyty-i-banki",
    answer:
      "Przy kredycie konsumenckim – tak. Gdy spłacasz całość przed terminem, całkowity koszt kredytu (także prowizja) zmniejsza się proporcjonalnie do skrócenia okresu. Kredytodawca powinien rozliczyć się z Tobą w ciągu 14 dni od spłaty, bez Twojego wniosku.",
    actions: [
      "Po spłacie sprawdź, czy dostałeś/aś rozliczenie w 14 dni.",
      "Przelicz zwrot: koszty pozaodsetkowe ÷ liczba dni umowy × liczba dni skrócenia.",
      "Jeśli zwrot jest za niski – złóż reklamację, a potem wniosek do Rzecznika Finansowego.",
    ],
    explanation: "Zasady proporcjonalnego zwrotu dotyczą kredytów konsumenckich. Kredyty zabezpieczone hipoteką podlegają innym przepisom.",
    sources: ["rfWczesniejszaSplata", "ustawaKredytKonsumencki"],
    relatedInstruction: "jak-sprawdzic-koszty-kredytu",
  }),
  q({
    slug: "jak-zlozyc-reklamacje-w-banku",
    title: "Jak złożyć skuteczną reklamację w banku?",
    category: "kredyty-i-banki",
    answer:
      "Złóż ją na piśmie (lub w kanale wskazanym przez bank), opisz problem, czego żądasz i dołącz dowody. Bank ma 30 dni na odpowiedź, a w sprawach szczególnie skomplikowanych – do 60 dni. Jeśli nie odpowie w terminie, reklamację uważa się za rozpatrzoną zgodnie z Twoją wolą.",
    actions: [
      "Opisz: numer umowy, co się stało, czego żądasz.",
      "Zachowaj potwierdzenie złożenia z datą.",
      "Pilnuj terminu odpowiedzi.",
      "Gdy bank odmówi – złóż wniosek do Rzecznika Finansowego.",
    ],
    explanation: "Dla reklamacji usług płatniczych (np. nieautoryzowanych transakcji) obowiązują krótsze terminy.",
    sources: ["rfReklamacja"],
    relatedInstruction: null,
    relatedQuestions: ["jak-zlozyc-wniosek-do-rzecznika-finansowego"],
  }),
  q({
    slug: "jak-zlozyc-wniosek-do-rzecznika-finansowego",
    title: "Jak złożyć wniosek do Rzecznika Finansowego?",
    category: "kredyty-i-banki",
    answer:
      "Najpierw musisz przejść reklamację w banku lub u ubezpieczyciela. Jeśli odpowiedź jest odmowna albo jej nie ma w terminie – możesz złożyć do Rzecznika Finansowego bezpłatny wniosek o interwencję lub o postępowanie polubowne.",
    actions: ["Zbierz reklamację i odpowiedź instytucji.", "Wypełnij wniosek na stronie rf.gov.pl.", "Dołącz umowę i korespondencję."],
    sources: ["rfReklamacja", "rfRzecznik"],
    relatedInstruction: null,
    relatedQuestions: ["jak-zlozyc-reklamacje-w-banku"],
  }),
  q({
    slug: "czy-konsolidacja-kredytow-sie-oplaca",
    title: "Czy konsolidacja kredytów się opłaca?",
    category: "kredyty-i-banki",
    answer:
      "Nie zawsze. Niższa rata zwykle oznacza dłuższy okres spłaty i wyższy łączny koszt. Konsolidacja ma sens, gdy łączna kwota do zapłaty (z prowizją i ubezpieczeniem) jest niższa albo gdy pozwala uniknąć zaległości – i gdy budżet się domyka.",
    actions: [
      "Porównaj łączną kwotę do zapłaty przed i po konsolidacji.",
      "Sprawdź prowizję, ubezpieczenie i RRSO nowego kredytu.",
      "Upewnij się, że nowa rata zmieści się w budżecie.",
    ],
    sources: ["ustawaKredytKonsumencki"],
    relatedInstruction: "co-zrobic-gdy-nie-mozesz-splacac-rat-kredytu",
  }),
  q({
    slug: "co-to-jest-rrso",
    title: "Co to jest RRSO?",
    category: "kredyty-i-banki",
    answer:
      "RRSO to rzeczywista roczna stopa oprocentowania – pokazuje całkowity koszt kredytu (odsetki, prowizje, opłaty) w skali roku. Pozwala porównywać oferty. Błędnie podana RRSO w umowie kredytu konsumenckiego może mieć znaczenie dla sankcji kredytu darmowego.",
    actions: ["Porównuj oferty po RRSO i łącznej kwocie do zapłaty, nie tylko po racie.", "Sprawdź RRSO w formularzu informacyjnym i umowie."],
    sources: ["ustawaKredytKonsumencki", "rfSkdWebinar"],
    relatedInstruction: "jak-sprawdzic-koszty-kredytu",
    relatedPath: "bledy",
  }),

  /* ---------- Umowy i konsumenci ---------- */
  q({
    slug: "jak-zlozyc-reklamacje-towaru",
    title: "Jak złożyć reklamację wadliwego towaru?",
    category: "umowy-i-konsumenci",
    answer:
      "Sprzedawca odpowiada za brak zgodności towaru z umową przez 2 lata od wydania. Złóż reklamację – najlepiej na piśmie – i wskaż, czego żądasz: naprawy lub wymiany. Sprzedawca ponosi koszty naprawy lub wymiany. Paragon nie jest jedynym dowodem zakupu – wystarczy np. wyciąg z karty.",
    actions: [
      "Opisz wadę i datę jej zauważenia.",
      "Wskaż żądanie: naprawa lub wymiana (obniżenie ceny lub odstąpienie – gdy naprawa/wymiana się nie uda).",
      "Dołącz dowód zakupu i zachowaj kopię reklamacji.",
      "Pilnuj 14 dni na odpowiedź sprzedawcy.",
    ],
    sources: ["uokikNiezgodnosc"],
    relatedInstruction: null,
    relatedQuestions: ["ile-czasu-ma-sklep-na-odpowiedz-na-reklamacje"],
  }),
  q({
    slug: "ile-czasu-ma-sklep-na-odpowiedz-na-reklamacje",
    title: "Ile czasu ma sklep na odpowiedź na reklamację?",
    category: "umowy-i-konsumenci",
    answer:
      "14 dni od otrzymania reklamacji. Jeśli sprzedawca nie odpowie w tym czasie, uważa się, że uznał reklamację.",
    actions: ["Zachowaj dowód daty złożenia reklamacji.", "Po 14 dniach bez odpowiedzi powołaj się na uznanie reklamacji na piśmie."],
    sources: ["uokikNiezgodnosc"],
    relatedInstruction: null,
    relatedQuestions: ["jak-zlozyc-reklamacje-towaru"],
  }),
  q({
    slug: "czy-sklep-moze-odmowic-zwrotu",
    title: "Kiedy sklep internetowy może odmówić przyjęcia zwrotu?",
    category: "umowy-i-konsumenci",
    answer:
      "Tylko w przypadkach wymienionych w ustawie, np. gdy towar był wykonany według Twojej specyfikacji, szybko się psuje, został dostarczony w zapieczętowanym opakowaniu i otwarty (gdy zwrot nie jest możliwy ze względów higienicznych) albo gdy usługa została w pełni wykonana za Twoją wyraźną zgodą. Sklep nie może wyłączyć tego prawa w regulaminie.",
    actions: ["Sprawdź, czy Twój zakup mieści się w wyjątkach.", "Jeśli nie – złóż oświadczenie o odstąpieniu w 14 dni."],
    sources: ["uokikWylaczenia", "uokikOdstapienie"],
    relatedInstruction: null,
    relatedQuestions: ["ile-dni-na-zwrot-towaru-kupionego-w-internecie"],
  }),
  q({
    slug: "co-zrobic-gdy-firma-nie-zwraca-pieniedzy",
    title: "Co zrobić, gdy sklep nie zwraca pieniędzy po odstąpieniu od umowy?",
    category: "umowy-i-konsumenci",
    answer:
      "Sprzedawca ma 14 dni od otrzymania Twojego oświadczenia o odstąpieniu na zwrot płatności (może wstrzymać się do czasu otrzymania towaru lub dowodu odesłania). Gdy nie płaci – wyślij wezwanie do zapłaty, skorzystaj z pomocy rzecznika konsumentów, a ostatecznie złóż pozew.",
    actions: [
      "Wyślij wezwanie do zapłaty z terminem.",
      "Przy płatności kartą zapytaj bank o procedurę chargeback.",
      "Skontaktuj się z miejskim lub powiatowym rzecznikiem konsumentów.",
      "Rozważ pozew, np. w elektronicznym postępowaniu upominawczym.",
    ],
    sources: ["uokikOdstapienie", "uokik", "msEpu"],
    relatedInstruction: null,
  }),
  q({
    slug: "umowa-podpisana-na-pokazie-jak-odstapic",
    title: "Jak odstąpić od umowy podpisanej na pokazie lub w domu?",
    category: "umowy-i-konsumenci",
    answer:
      "Umowa zawarta poza lokalem przedsiębiorstwa (np. na pokazie, w domu) daje Ci 14 dni na odstąpienie bez podania przyczyny. Przy umowach zawieranych poza lokalem termin biegnie co do zasady od dnia zawarcia umowy. Jeśli nie poinformowano Cię o tym prawie – termin wydłuża się o 12 miesięcy.",
    actions: ["Wyślij oświadczenie o odstąpieniu przed upływem terminu – listem poleconym lub e-mailem.", "Zachowaj dowód wysłania.", "Nie podpisuj dodatkowych umów kredytu „na miejscu” bez czytania."],
    sources: ["uokikOdstapienie"],
    relatedInstruction: null,
  }),
  q({
    slug: "jak-zglosic-sprawe-do-rzecznika-konsumentow",
    title: "Jak zgłosić sprawę do rzecznika konsumentów?",
    category: "umowy-i-konsumenci",
    answer:
      "Miejscy i powiatowi rzecznicy konsumentów udzielają bezpłatnych porad i mogą interweniować u przedsiębiorcy. Kontakt znajdziesz w urzędzie swojego miasta lub starostwie. Przygotuj umowę, dowód zakupu i korespondencję ze sprzedawcą.",
    actions: ["Znajdź dane rzecznika w urzędzie miasta lub powiatu.", "Opisz krótko sprawę i czego oczekujesz.", "Dołącz dokumenty."],
    sources: ["uokik"],
    relatedInstruction: null,
  }),

  /* ---------- Inne sprawy ---------- */
  q({
    slug: "jak-liczyc-terminy-sadowe",
    title: "Jak liczyć terminy w piśmie z sądu?",
    category: "inne-sprawy",
    answer:
      "Termin w tygodniach kończy się w dniu tygodnia odpowiadającym dniowi doręczenia. Przykład: pismo odebrane w środę – termin dwutygodniowy kończy się w środę za dwa tygodnie. Jeśli ostatni dzień przypada w sobotę lub dzień wolny, termin upływa w najbliższy dzień roboczy.",
    actions: [
      "Zapisz datę odbioru pisma (lub datę doręczenia z awizo).",
      "Policz koniec terminu i zapisz go w kalendarzu.",
      "Wyślij pismo listem poleconym w polskiej placówce pocztowej najpóźniej ostatniego dnia – data nadania się liczy.",
    ],
    sources: ["kcTerminy", "srKoscianTerminy"],
    relatedInstruction: null,
    relatedQuestions: ["co-zrobic-po-otrzymaniu-nakazu-zaplaty", "czy-mozna-przywrocic-termin-sadowy"],
  }),
  q({
    slug: "czy-mozna-przywrocic-termin-sadowy",
    title: "Czy można przywrócić termin, który minął?",
    category: "inne-sprawy",
    answer:
      "Tak, jeśli uchybiłeś/aś mu bez swojej winy (np. choroba, brak doręczenia). Wniosek o przywrócenie terminu składasz w ciągu tygodnia od ustania przeszkody i jednocześnie dokonujesz spóźnionej czynności (np. składasz sprzeciw). Nawet lekkie niedbalstwo wyklucza przywrócenie. Po roku – tylko wyjątkowo.",
    actions: [
      "Ustal dzień, w którym przeszkoda ustała.",
      "W ciągu 7 dni złóż wniosek wraz z zaległym pismem.",
      "Uprawdopodobnij brak winy dokumentami (np. zaświadczenie lekarskie).",
    ],
    sources: ["przywrocenieTerminu"],
    relatedInstruction: null,
    relatedQuestions: ["jak-liczyc-terminy-sadowe"],
  }),
  q({
    slug: "jak-uzyskac-zwolnienie-z-kosztow-sadowych",
    title: "Jak uzyskać zwolnienie od kosztów sądowych?",
    category: "inne-sprawy",
    answer:
      "Złóż wniosek do sądu, w którym toczy się lub będzie toczyć się sprawa, i dołącz oświadczenie o stanie rodzinnym, majątku, dochodach i źródłach utrzymania na urzędowym formularzu. W tym samym piśmie możesz poprosić o pełnomocnika z urzędu.",
    actions: [
      "Pobierz formularz oświadczenia ze strony sądu lub z biura podawczego.",
      "Wypełnij go dokładnie – podaj dochody wszystkich osób we wspólnym gospodarstwie.",
      "Dołącz dokumenty (zaświadczenia o dochodach, rachunki).",
    ],
    explanation: "Podanie nieprawdziwych danych w oświadczeniu grozi grzywną.",
    sources: ["zwolnienieKoszty"],
    relatedInstruction: null,
    relatedQuestions: ["jak-dostac-pelnomocnika-z-urzedu"],
  }),
  q({
    slug: "jak-dostac-pelnomocnika-z-urzedu",
    title: "Jak dostać pełnomocnika z urzędu w sprawie cywilnej?",
    category: "inne-sprawy",
    answer:
      "Złóż do sądu wniosek o ustanowienie adwokata lub radcy prawnego z urzędu wraz z oświadczeniem o stanie rodzinnym, majątku i dochodach. Sąd ocenia, czy nie stać Cię na pełnomocnika i czy jego udział jest potrzebny w sprawie.",
    actions: ["Wypełnij oświadczenie majątkowe.", "W wniosku wyjaśnij, dlaczego potrzebujesz pomocy prawnika.", "Do czasu decyzji pilnuj terminów w sprawie."],
    sources: ["zwolnienieKoszty"],
    relatedInstruction: null,
    relatedQuestions: ["jak-uzyskac-zwolnienie-z-kosztow-sadowych"],
  }),
  q({
    slug: "co-to-jest-awizo-z-sadu",
    title: "Co zrobić z awizo z sądu?",
    category: "inne-sprawy",
    answer:
      "Odbierz pismo jak najszybciej. Nieodebrane pismo sądowe po upływie okresu przechowywania co do zasady uznaje się za doręczone – terminy zaczynają biec, nawet jeśli go nie przeczytasz.",
    actions: [
      "Odbierz przesyłkę na poczcie lub w punkcie wskazanym w awizo.",
      "Zapisz datę odbioru – od niej liczysz terminy.",
      "Jeśli przegapiłeś/aś termin bez swojej winy – sprawdź możliwość przywrócenia terminu.",
    ],
    sources: ["przywrocenieTerminu"],
    relatedInstruction: null,
    relatedQuestions: ["jak-liczyc-terminy-sadowe"],
  }),
  q({
    slug: "co-zrobic-gdy-dostane-pozew",
    title: "Co zrobić, gdy dostanę pozew z sądu?",
    category: "inne-sprawy",
    answer:
      "Przeczytaj pouczenie – sąd wskazuje, czy i w jakim terminie musisz złożyć odpowiedź na pozew. Brak reakcji może skończyć się wyrokiem zaocznym. Zbierz dokumenty i zapisz, z czym się nie zgadzasz.",
    actions: [
      "Zapisz datę doręczenia i termin z pouczenia.",
      "Przygotuj odpowiedź na pozew: co kwestionujesz i jakie masz dowody.",
      "Jeśli nie stać Cię na prawnika – złóż wniosek o pełnomocnika z urzędu lub skorzystaj z nieodpłatnej pomocy prawnej.",
    ],
    sources: ["zwolnienieKoszty", "nieodplatnaPomoc"],
    relatedInstruction: null,
    relatedQuestions: ["jak-liczyc-terminy-sadowe"],
  }),
];
