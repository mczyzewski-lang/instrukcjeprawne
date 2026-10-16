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

test("formularz eksperta: walidacja, ujawnienie partnera i zapis zgłoszenia", async ({ page }) => {
  await page.goto("/instrukcje/jak-rozwiesc-sie-bez-konfliktu");
  const help = page.locator("#pomoc");
  await expect(help.getByText("Nie musisz wszystkiego robić samodzielnie.")).toBeVisible();
  await help.getByRole("button", { name: "Porozmawiaj bezpłatnie z ekspertem →" }).click();
  await expect(help.getByText(/podmiot komercyjny \(Nowy Etap\)/)).toBeVisible();
  await help.getByRole("button", { name: "Poproś o bezpłatną rozmowę" }).click();
  await expect(help.getByText("Podaj imię.")).toBeVisible();
  await expect(help.getByText(/Zaznacz zgodę/)).toBeVisible();
  await help.getByLabel("Imię").fill("Ewa");
  await help.getByLabel("Numer telefonu").fill("600 100 200");
  await help.getByRole("checkbox").check();
  await page.waitForTimeout(2600); // zabezpieczenie czasowe przed botami
  await help.getByRole("button", { name: "Poproś o bezpłatną rozmowę" }).click();
  await expect(help.getByText("Dziękujemy. Zgłoszenie zostało przyjęte.")).toBeVisible();
});

test("pytanie: krótka odpowiedź, działania, link do instrukcji, źródła", async ({ page }) => {
  await page.goto("/pytania/czy-komornik-moze-zajac-cale-konto");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Czy komornik może zająć całe konto?");
  await expect(page.getByText("3604,50 zł").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Co zrobić?" })).toBeVisible();
  await expect(page.getByText("Zobacz całą instrukcję")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Źródła i stan prawny" })).toBeVisible();
  // szkice z kolejki redakcyjnej nie są publiczne
  const r = await page.goto("/pytania/jak-odrzucic-spadek-z-dlugami");
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
  await expect(page.getByText("Ewa")).toBeVisible();
});
