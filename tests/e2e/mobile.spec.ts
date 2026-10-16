import { expect, test } from "@playwright/test";

const PAGES = ["/", "/instrukcje/jak-wyjsc-z-dlugow", "/instrukcje/jak-ochronic-marke", "/pytania", "/pytania/ile-kosztuje-rozwod", "/kategorie/kredyty-i-banki"];

for (const url of PAGES) {
  test(`mobile: brak poziomego przewijania – ${url}`, async ({ page }) => {
    await page.goto(url);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

test("mobile: menu działa i pasek zgody nie blokuje treści", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("region", { name: "Ustawienia prywatności" })).toBeVisible();
  await page.getByRole("button", { name: "Nie, dziękuję" }).click();
  await expect(page.getByRole("region", { name: "Ustawienia prywatności" })).toHaveCount(0);
  await page.getByText("Menu", { exact: true }).click();
  await page.getByRole("navigation", { name: "Menu mobilne" }).getByRole("link", { name: "Najczęstsze pytania" }).click();
  await expect(page).toHaveURL(/\/pytania$/);
});

test("mobile: przyciski drzewa decyzji mają co najmniej 44 px wysokości", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("ip_consent_v1", "denied"));
  await page.goto("/instrukcje/jak-wyjsc-z-dlugow");
  const btn = page.locator("#drzewo").getByRole("button", { name: "Mam pismo z sądu albo od komornika" });
  const box = await btn.boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);
});
