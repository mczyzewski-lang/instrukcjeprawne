import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // decyzja o analityce zapisana z góry, żeby pasek nie zasłaniał elementów
  await page.addInitScript(() => localStorage.setItem("ip_consent_v1", "granted"));
});

test("strona główna: wyszukiwarka podpowiada konkretny problem", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Trudna sprawa.");
  const box = page.getByRole("combobox", { name: "Jaki problem chcesz rozwiązać?" });
  await box.fill("komornik zajął konto");
  const options = page.getByRole("option");
  await expect(options.first()).toBeVisible();
  await options.filter({ hasText: "komornik zajął konto" }).first().click();
  await expect(page).toHaveURL(/komornik-zajal-konto|czy-komornik-moze-zajac/);
});

test("wyszukiwanie bez JS działa jako formularz", async ({ page }) => {
  await page.goto("/szukaj?q=rozwód bez wojny");
  await expect(page.getByRole("link", { name: /rozwieść się szybko/i }).first()).toBeVisible();
});

test("drzewo decyzji: przejście, cofanie, wynik, udostępnienie linku", async ({ page }) => {
  await page.goto("/instrukcje/jak-wyjsc-z-dlugow");
  const tree = page.locator("#drzewo");
  await tree.getByRole("button", { name: "Mam pismo z sądu albo od komornika" }).click();
  await expect(tree.getByRole("heading", { name: /przeznaczyć jakąś kwotę/ })).toBeVisible();
  await tree.getByRole("button", { name: "Wstecz" }).click();
  await expect(tree.getByRole("heading", { name: /opisuje Twoją sytuację/ })).toBeVisible();
  await tree.getByRole("button", { name: "Mam pismo z sądu albo od komornika" }).click();
  await tree.getByRole("button", { name: "Tak, ale tylko część" }).click();
  await tree.getByRole("button", { name: "Nie", exact: true }).click();
  await tree.getByRole("button", { name: "Nie wiem" }).click();
  await expect(tree.getByRole("heading", { name: "Drogi warte sprawdzenia w Twojej sytuacji" })).toBeVisible();
  await expect(tree.getByText("Pilne:")).toBeVisible();
  await expect(tree.getByText(/wybrano „nie wiem”/)).toBeVisible();
  await expect(tree.getByText("To orientacja na podstawie kilku odpowiedzi, a nie ocena prawna.", { exact: false })).toBeVisible();

  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await tree.getByRole("button", { name: "Udostępnij wynik" }).click();
  await expect(page).toHaveURL(/odp=o-pismo-sad\.o-czesc\.o-firma-nie\.o-pewne-nie-wiem/);

  // link odtwarza wynik
  await page.reload();
  await expect(page.locator("#drzewo").getByRole("heading", { name: "Drogi warte sprawdzenia w Twojej sytuacji" })).toBeVisible();

  // podsumowanie do druku
  const href = await tree.getByRole("link", { name: "Drukuj podsumowanie" }).getAttribute("href");
  await page.goto(href!);
  await expect(page.getByText("Twoje odpowiedzi")).toBeVisible();
  await expect(page.getByText(/Pierwsze kroki/)).toBeVisible();

  // od nowa
  await page.goto("/instrukcje/jak-wyjsc-z-dlugow?odp=o-zaleglosci.o-nic");
  await page.locator("#drzewo").getByRole("button", { name: "Od nowa" }).click();
  await expect(page.locator("#drzewo").getByRole("heading", { name: /opisuje Twoją sytuację/ })).toBeVisible();
});

test("wybór drogi z wyniku, oznaczanie kroków i zapamiętanie postępu", async ({ page }) => {
  await page.goto("/instrukcje/jak-wyjsc-z-dlugow?odp=o-zaleglosci.o-nic.o-firma-nie.o-pewne-tak");
  await page.locator("#drzewo").getByRole("button", { name: "Upadłość konsumencka →" }).click();
  await expect(page).toHaveURL(/#droga-upadlosc/);
  const steps = page.locator("#kroki");
  await expect(steps.getByRole("heading", { level: 3, name: "Upadłość konsumencka" })).toBeVisible();
  await steps.getByRole("button", { name: "Oznacz jako zrobione" }).first().click();
  await expect(steps.getByText("Zrobione: 1 z 5")).toBeVisible();
  await page.goto("/instrukcje/jak-wyjsc-z-dlugow");
  await expect(page.locator("#kroki").getByText("Zrobione: 1 z 5")).toBeVisible();
  await expect(page.locator("#wybor-drogi")).toHaveValue("upadlosc");
});

test("checklista i PDF bez podawania e-maila", async ({ page, request }) => {
  await page.goto("/instrukcje/jak-wyjsc-z-dlugow#droga-upadlosc");
  const docs = page.locator("#dokumenty");
  await docs.getByRole("checkbox").first().check();
  const href = await docs.getByRole("link", { name: "Zapisz listę jako PDF" }).getAttribute("href");
  expect(href).toContain("lista=upadlosc");
  expect(href).toContain("zaznaczone=");
  const pdf = await request.get(href!);
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toBe("application/pdf");
  const full = await request.get("/instrukcje/jak-placic-5-procent-podatku-jako-programista/pdf");
  expect(full.status()).toBe(200);
  expect((await full.body()).subarray(0, 4).toString()).toBe("%PDF");
});

test("chat z ekspertem: dane w oknie czatu, zgoda marketingowa po poprawnym e-mailu, pytanie", async ({ page }) => {
  await page.goto("/instrukcje/jak-rozwiesc-sie-bez-konfliktu");
  const help = page.locator("#pomoc");
  await expect(help.getByText("Nie musisz wszystkiego robić samodzielnie.")).toBeVisible();
  // czat widoczny od razu, z zakładkami
  await expect(help.getByRole("tab", { name: "Chat z ekspertem" })).toHaveAttribute("aria-selected", "true");
  await expect(help.getByRole("tab", { name: "Wyślij wiadomość e-mail" })).toBeVisible();
  await expect(help.getByText("odpowiada merytorycznie za ten dział")).toBeVisible();
  await help.getByText("Kto prowadzi rozmowę i co dzieje się z danymi").click();
  await expect(help.getByText(/podmiot komercyjny \(Nowy Etap\)/)).toBeVisible();
  await expect(help.getByText("Żeby rozpocząć rozmowę, wpisz swoje dane")).toBeVisible();
  await expect(help.getByText("Wiadomość automatyczna")).toHaveCount(0);
  await help.getByRole("button", { name: "Przejdź do pytania" }).click();
  await expect(help.getByText("Podaj imię.")).toBeVisible();
  await help.getByLabel("Imię").fill("Ewa");
  const email = help.getByLabel("E-mail", { exact: true });
  await email.fill("ewa@przyklad");
  await expect(help.getByText(/Zgadzam się na otrzymywanie od .* informacji marketingowych/)).toHaveCount(0);
  await email.fill("ewa@przyklad.pl");
  await expect(help.getByText(/Zgadzam się na otrzymywanie od .* informacji marketingowych/)).toBeVisible();
  await expect(help.getByText(/wyślemy Ci SMS/)).toBeVisible();
  await expect(help.getByLabel("Prefiks kraju")).toHaveValue("+48");
  await help.getByLabel("Telefon").fill("600 100 200");
  await help.getByRole("button", { name: "Przejdź do pytania" }).click();
  await expect(help.getByText("Napisz swoje pytanie")).toBeVisible();
  await help.getByLabel("Twoje pytanie").fill("Chcemy rozwieść się zgodnie, mamy jedno dziecko.");
  await page.waitForTimeout(3100); // zabezpieczenie czasowe przed botami
  await help.getByRole("button", { name: "Wyślij" }).click();
  await expect(help.getByText("Chcemy rozwieść się zgodnie, mamy jedno dziecko.")).toBeVisible();
  await expect(help.getByText(/Odpowiedź pojawi się tutaj/)).toBeVisible();
  // rozmowa wraca po odświeżeniu strony
  await page.reload();
  await expect(page.locator("#pomoc").getByText("Chcemy rozwieść się zgodnie, mamy jedno dziecko.")).toBeVisible();
});

test("wiadomość e-mail do eksperta wysyłana przez stronę", async ({ page }) => {
  await page.goto("/instrukcje/jak-wyjsc-z-dlugow");
  const help = page.locator("#pomoc");
  await help.getByRole("tab", { name: "Wyślij wiadomość e-mail" }).click();
  await expect(help.locator('a[href^="mailto:"]')).toHaveCount(0);
  await help.getByLabel("Imię").fill("Jan");
  await help.getByLabel("E-mail", { exact: true }).fill("jan@przyklad.pl");
  await expect(help.getByLabel("Temat")).toHaveValue(/^Pytanie: /);
  await help.getByLabel("Wiadomość", { exact: true }).fill("Mam trzy chwilówki i komornika, od czego zacząć?");
  await page.waitForTimeout(3100);
  await help.getByRole("button", { name: "Wyślij wiadomość" }).click();
  await expect(help.getByText("Wiadomość wysłana")).toBeVisible();
  await expect(help.getByText("Odpowiedź przyjdzie na adres jan@przyklad.pl.")).toBeVisible();
});

test("pytanie: krótka odpowiedź, działania, link do instrukcji, źródła", async ({ page }) => {
  await page.goto("/pytania/czy-komornik-moze-zajac-cale-konto");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Czy komornik może zająć całe konto?");
  await expect(page.getByText("3604,50 zł").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Co zrobić?" })).toBeVisible();
  await expect(page.getByText("Zobacz całą instrukcję")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Źródła i stan prawny" })).toBeVisible();
  // szkice z kolejki redakcyjnej nie są publiczne
  const r = await page.goto("/pytania/ile-trwa-rozwod-bez-orzekania-o-winie");
  expect(r?.status()).toBe(404);
});

test("SEO: treści robocze mają noindex, sitemap zawiera tylko zatwierdzone", async ({ page, request }) => {
  await page.goto("/instrukcje/jak-wyjsc-z-dlugow");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/instrukcje\/jak-wyjsc-z-dlugow$/);
  const sm = await (await request.get("/sitemap.xml")).text();
  expect(sm).toContain("/kategorie/dlugi-i-komornik");
  expect(sm).not.toContain("/instrukcje/jak-wyjsc-z-dlugow<");
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /admin");
});

test("panel: logowanie, publikacja instrukcji i import CSV", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.getByLabel("Imię i nazwisko (recenzent)").fill("Anna Testowa");
  await page.getByLabel("Hasło").fill("zle-haslo");
  await page.getByRole("button", { name: "Zaloguj" }).click();
  await expect(page.getByText("Nieprawidłowe hasło.")).toBeVisible();
  await expect(page.getByLabel("Imię i nazwisko (recenzent)")).toHaveValue("Anna Testowa");
  await page.getByLabel("Hasło").fill("test-haslo-e2e");
  await page.getByRole("button", { name: "Zaloguj" }).click();
  await expect(page.getByRole("heading", { name: "Pulpit" })).toBeVisible();

  await page.goto("/admin/instrukcje/komornik-konto");
  await page.getByRole("button", { name: "Zatwierdź i opublikuj" }).click();
  await expect(page.getByText(/Opublikowano\. Zatwierdził\(a\): Anna Testowa/)).toBeVisible();
  await page.goto("/instrukcje/co-zrobic-gdy-komornik-zajal-konto");
  await expect(page.getByText("Wersja robocza.")).toHaveCount(0);
  await expect(page.locator("#zrodla").getByText("Anna Testowa")).toBeVisible();

  await page.goto("/admin/pytania/import");
  await page.getByLabel("…albo wklej treść CSV").fill("title,category,actions\nCzy można zaimportować testowe pytanie?,inne-sprawy,Krok A | Krok B");
  await page.getByRole("button", { name: "Importuj jako szkice" }).click();
  await expect(page.getByText("Zaimportowano: 1")).toBeVisible();
  const r = await page.goto("/pytania/czy-mozna-zaimportowac-testowe-pytanie");
  expect(r?.status()).toBe(404);

  await page.goto("/admin/leady");
  await expect(page.getByText("Ewa").first()).toBeVisible();

  // odpowiedź eksperta w czacie
  await page.goto("/admin/czaty");
  await page.getByRole("link", { name: /Ewa/ }).first().click();
  await page.getByLabel("Odpowiedź").fill("Dzień dobry, zacznijmy od planu wychowawczego.");
  await page.getByLabel("Podpis (kto odpowiada)").fill("Ekspert testowy");
  await page.getByRole("button", { name: "Wyślij odpowiedź" }).click();
  await expect(page.getByText(/Wysłano\. SMS:/)).toBeVisible();
  await page.reload();
  await expect(page.getByText("Dzień dobry, zacznijmy od planu wychowawczego.").first()).toBeVisible();
});

test("ekspert nadzorujący i strona Jak to działa", async ({ page }) => {
  await page.goto("/instrukcje/jak-wyjsc-z-dlugow");
  await expect(page.getByText("Merytorycznie nadzoruje:")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Kto odpowiada za tę instrukcję" })).toBeVisible();
  // ekspert nie pojawia się w nagłówku (hero) instrukcji
  await expect(page.locator("article > header").getByText("Merytorycznie nadzoruje")).toHaveCount(0);
  await page.goto("/informacje");
  await expect(page).toHaveURL(/\/jak-to-dziala$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Pokazujemy, co zrobić");
  await expect(page.getByText("Tu pojawi się film od założycieli")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Z czego składa się instrukcja" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Kto nadzoruje treści" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Główna nawigacja" }).getByRole("link", { name: "Informacje" })).toHaveCount(0);
});

test("przyklejony pasek pokazuje bieżącą sekcję i pozwala przejść do innej", async ({ page }) => {
  await page.goto("/instrukcje/jak-wyjsc-z-dlugow");
  const bar = page.getByRole("navigation", { name: "Bieżąca sekcja instrukcji" });
  await expect(bar).toBeHidden();
  await page.locator("#kroki").scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 300);
  await expect(bar).toBeVisible();
  await expect(bar).toContainText("Instrukcja krok po kroku");
  await bar.getByRole("button", { name: "Sekcje" }).click();
  await bar.getByRole("link", { name: /Na co uważać/ }).click();
  await expect(bar).toContainText("Na co uważać?");
});

test("linki zewnętrzne nie wyprowadzają ze strony – adres można skopiować", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/instrukcje/jak-ochronic-marke");
  const external = page.locator('main a[href^="http"]:not([href*="localhost"])');
  await expect(external).toHaveCount(0);
  const copy = page.getByRole("button", { name: /^Kopiuj adres: https:\/\// }).first();
  const url = (await copy.getAttribute("aria-label"))!.replace("Kopiuj adres: ", "");
  await copy.click();
  await expect(page.getByRole("button", { name: "Skopiowano adres" }).first()).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(url);
});

test("Plan: kreator pytań w okienku, plan z celem i etapami, PDF i omówienie z ekspertem", async ({ page, request }) => {
  await page.goto("/instrukcje/jak-wyjsc-z-dlugow");
  // odpowiedź z sekcji A nie jest zadawana drugi raz w kreatorze
  const firstQ = page.locator('section[aria-labelledby="sekcja-a"] ol > li').first();
  const firstQText = (await firstQ.locator("p").first().innerText()).replace(/^\d+\s*/, "");
  await firstQ.getByRole("button", { name: "Tak" }).click();
  await page.getByRole("button", { name: "Wygeneruj bezpłatnie Plan oddłużenia" }).last().click();
  const plan = page.getByRole("dialog");
  await expect(plan.getByText(firstQText, { exact: true })).toHaveCount(0);
  // 1. sytuacja
  await expect(plan.getByRole("heading", { name: "Twoja sytuacja" })).toBeVisible();
  await plan.getByRole("button", { name: "Tak" }).first().click();
  await plan.getByRole("button", { name: "Dalej" }).click();
  // 2. drzewo decyzji w kreatorze
  for (let i = 0; i < 8 && (await plan.locator("fieldset legend").count()) > 0; i++) await plan.locator("fieldset li button").first().click();
  await expect(plan.getByText("Na podstawie odpowiedzi:")).toBeVisible();
  await plan.getByRole("button", { name: "Dalej" }).click();
  // 3. droga (podpowiedziana)
  await expect(plan.getByText(/pasuje do odpowiedzi/).first()).toBeVisible();
  await plan.getByRole("button", { name: "Dalej" }).click();
  // 4. dokumenty, które już są
  await plan.locator('input[type="checkbox"]').first().check();
  await plan.getByRole("button", { name: "Dalej" }).click();
  // 5. termin – z wyjaśnieniem; bez pytań o sposób działania i tempo
  await expect(plan.getByText(/Termin to ostatni dzień/)).toBeVisible();
  await expect(plan.getByText("Jak chcesz działać?")).toHaveCount(0);
  await expect(plan.getByText(/Ile czasu w tygodniu/)).toHaveCount(0);
  await plan.getByLabel("Nie wiem").check();
  await plan.getByLabel("Imię na planie (opcjonalnie)").fill("Ola");
  await plan.getByRole("button", { name: "Utwórz mój plan" }).click();

  await expect(plan.getByRole("heading", { name: "Plan oddłużenia – Ola" })).toBeVisible();
  await expect(plan.getByText("Twój cel")).toBeVisible();
  await expect(plan.getByText("Gdzie jesteś teraz")).toBeVisible();
  await expect(plan.getByText("Ustal, czy w sprawie biegnie termin").first()).toBeVisible();
  await expect(plan.getByRole("heading", { name: "Jak chcesz działać dalej?" })).toBeVisible();
  await expect(plan.getByText("Koniec planu")).toBeVisible();
  await expect(plan.getByText("Z bezpłatną pomocą", { exact: true })).toHaveCount(0);
  // przyklejony pasek okna
  await expect(plan.getByRole("button", { name: "Omów bezpłatnie Plan oddłużenia z ekspertem" })).toBeVisible();

  // odhaczenie w planie = odhaczenie kroku w sekcji C
  await plan.locator('section[aria-label^="Działaj"] input[type="checkbox"]').nth(1).check();
  await plan.getByRole("button", { name: "Zamknij plan" }).click();
  await expect(page.locator("#kroki").getByRole("button", { name: "Zrobione", exact: true })).toHaveCount(1);
  // plan zostaje po odświeżeniu
  await page.reload();
  await expect(page.locator("#plan").getByText("Plan oddłużenia – Ola")).toBeVisible();
  await page.locator("#plan").getByRole("button", { name: "Otwórz plan" }).click();

  const href = await plan.getByRole("link", { name: "Pobierz plan (PDF)" }).getAttribute("href");
  const pdf = await request.get(href!);
  expect(pdf.headers()["content-type"]).toContain("application/pdf");
  expect((await pdf.body()).subarray(0, 4).toString()).toBe("%PDF");

  await plan.getByRole("button", { name: "Omów bezpłatnie Plan oddłużenia z ekspertem" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  const help = page.locator("#pomoc");
  await expect(help.getByText("Do pierwszej wiadomości dołączymy:")).toBeVisible();
  await expect(help.getByRole("link", { name: /^Plan oddłużenia – Ola \(\d\d\.\d\d\.\d\d\)\.pdf$/ })).toBeVisible();
  await help.getByLabel("Imię", { exact: true }).fill("Ola");
  await help.getByLabel("E-mail", { exact: true }).fill("ola@przyklad.pl");
  await help.getByLabel("Telefon").fill("600 200 300");
  await help.getByRole("button", { name: "Przejdź do pytania" }).click();
  await expect(help.getByLabel("Twoje pytanie")).toHaveValue(/w załączeniu mój Plan oddłużenia/);
  await page.waitForTimeout(3100);
  await help.getByRole("button", { name: "Wyślij" }).click();
  await expect(help.getByRole("log").getByRole("link", { name: /^Plan oddłużenia – Ola \(\d\d\.\d\d\.\d\d\)\.pdf$/ })).toBeVisible();
});
