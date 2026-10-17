# InstrukcjePrawne.pl — Proste instrukcje na trudne sprawy

Interaktywny system instrukcji rozwiązywania problemów prawnych w Polsce. Każda instrukcja ma ten sam szablon:
**A** sytuacja → **B** możliwe drogi (drzewo decyzji + mapa dróg) → **C** kroki → **D** dokumenty → **E** ostrzeżenia → **F** pomoc → źródła i stan prawny.

## Uruchomienie

```bash
npm install
cp .env.example .env.local   # opcjonalnie – działa też bez konfiguracji
npm run dev                  # http://localhost:3000
```

Wymagany Node.js ≥ 22.13 (wbudowany `node:sqlite`, bez natywnych zależności).

| Polecenie | Opis |
|---|---|
| `npm run build && npm start` | build produkcyjny |
| `npm test` | testy jednostkowe (Vitest) |
| `npm run test:e2e` | testy E2E + audyt dostępności axe (Playwright) |
| `npm run check` | lint + typecheck + testy |
| `npm run db:reset` | usuwa lokalną bazę – przy starcie wgrają się treści z `src/content` |

Panel: `/admin`. Lokalnie bez `ADMIN_PASSWORD` hasło to `admin-lokalnie` (w produkcji panel bez hasła jest wyłączony).

## Co jest w środku

- **Next.js 16 (App Router), TypeScript, Tailwind 4**, SSG/ISR dla instrukcji i pytań.
- **Silnik instrukcji i drzew decyzji** konfigurowany danymi (`src/lib/decision-engine.ts`, `src/content/instructions/*`): wiele wyników, „nie wiem” = wynik niepełny, cofanie, od nowa, link `?odp=`, drukowalne podsumowanie `/instrukcje/[slug]/wynik`.
- **8 instrukcji**: długi osobiste, długi firmowe, IP BOX, ochrona marki, rozwód, koszty kredytu (SKD), zajęte konto, raty kredytu.
- **Baza pytań**: 93 odpowiedzi + kolejka redakcyjna (szkice niepubliczne) (szkice niepubliczne), import/eksport CSV, wideo (własne/Reels/TikTok/Shorts + transkrypcja).
- **Eksperci** nadzorujący działy (`/admin/eksperci`, zdjęcie, ujawnienie powiązań) – widoczni dyskretnie w sekcjach A i E oraz w karcie „Kto odpowiada za tę instrukcję”; strona `/jak-to-dziala` (o serwisie, budowa instrukcji, weryfikacja, eksperci) z miejscem na film 1:1; `/informacje` przekierowuje tam na stałe (`/admin/ustawienia`).
- **Kontakt z ekspertem działu** w sekcji F: zakładki „Chat z ekspertem” (dane kontaktowe w oknie czatu → pytanie → rozmowa; SMS przez `SMS_WEBHOOK_URL`, gdy użytkownika nie ma na stronie) i „Wyślij wiadomość e-mail” (formularz wysyłany przez stronę, odpowiedź e-mailem przez Resend: `RESEND_API_KEY`, `MAIL_FROM`). Brak automatycznych odpowiedzi – odpisuje człowiek w `/admin/czaty`.
- **CMS** (`/admin`): edycja instrukcji (pola + JSON dla drzewa/źródeł), szkic → do zatwierdzenia → publikacja z datą i nazwiskiem recenzenta, podgląd, archiwum; pytania; zgłoszenia; partnerzy; ilustracje; analityka.
- **Treści robocze i zatwierdzone są rozdzielone** (`draft_json` / `published_json`). Treści AI mają status „do zatwierdzenia”, oznaczenie na stronie i `noindex`; sitemap zawiera tylko treści zatwierdzone.
- **PDF** (pdfkit): cała instrukcja lub sama checklista, duże numery stron i kroków, SVG, schemat decyzji, źródła, kod QR. Bez e-maila.
- **Ilustracje**: 34 własne SVG; generator OpenAI (`src/lib/illustration-generator.ts`, `POST /v1/images/generations`) z cache, wersją promptu, zatwierdzaniem, regeneracją, uploadem ręcznym, odrzucaniem.
- **Formularz eksperta**: walidacja, honeypot + limit czasu + rate limit, zapis w bazie, webhook do partnera z podpisem HMAC (adresy tylko z env), jawna informacja o podmiocie komercyjnym.
- **Analityka** tylko po zgodzie, bez cookies i IP; główna metryka: odsetek sesji z instrukcją zakończonych konkretnym krokiem.
- **SEO**: metadata, OG, canonical, sitemap, robots, breadcrumbs (JSON-LD), Article/QAPage.
- **Dostępność**: testy axe WCAG 2.2 AA na kluczowych stronach, obsługa klawiatury, combobox ARIA, cele dotykowe ≥ 44 px.

## Research prawny

Research: 16.10.2026, wyszukiwarka z filtrem domen urzędowych (gov.pl, sejm.gov.pl, sądy, UPRP, EUIPO, UOKiK, RF, BGK). Bezpośrednie pobieranie stron było zablokowane w środowisku, więc część źródeł ma status „potwierdzone częściowo”. Rejestr: `src/content/sources.ts`; każda instrukcja ma listę `pendingVerification`. Projekty ustaw (UD260, rozwód w USC) są opisane wyłącznie jako niewiążące.

**Przed startem:** prawnik weryfikuje i zatwierdza treści w panelu, `PUBLIC_SHOW_UNREVIEWED=false`, uzupełnienie danych operatora i polityki prywatności, konfiguracja webhooków partnerów, nazwa zespołu SKD.

## Wdrożenie na Railway

Repozytorium zawiera `railway.json` (build, start, healthcheck) i `.node-version` (Node 22).

1. Railway → **New Project → Deploy from GitHub repo** → wybierz to repozytorium i gałąź.
2. W usłudze: **Settings → Volumes → Add Volume**, ścieżka montowania `/data`.
3. **Variables** (minimum):
   - `DATA_DIR=/data`
   - `NEXT_PUBLIC_SITE_URL=https://<twoja-domena-lub-adres>.up.railway.app`
   - `ADMIN_PASSWORD=<silne hasło>`
   - `ADMIN_SESSION_SECRET=<min. 32 losowe znaki>`
   - `HASH_SALT=<losowy ciąg>`
   - opcjonalnie: `PUBLIC_SHOW_UNREVIEWED`, `OPENAI_API_KEY`, `LEAD_WEBHOOK_*` (zob. `.env.example`)
4. **Settings → Networking → Generate Domain** (lub własna domena). Po zmianie adresu zaktualizuj `NEXT_PUBLIC_SITE_URL` i zrób redeploy – ta zmienna jest wkompilowana w build.

Baza tworzy się sama przy pierwszym starcie (treści z `src/content`). Dane panelu, zgłoszenia i grafiki leżą na wolumenie i przetrwają kolejne wdrożenia. Uruchamiaj jedną instancję (SQLite).

Inne hostingi: dowolny serwer Node z trwałym dyskiem (VPS, Fly.io, Render z dyskiem). Platformy bez trwałego dysku (np. Vercel) wymagają zamiany bazy.
