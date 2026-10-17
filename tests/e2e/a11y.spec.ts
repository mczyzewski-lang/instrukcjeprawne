import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES = ["/", "/informacje", "/instrukcje", "/instrukcje/jak-wyjsc-z-dlugow", "/instrukcje/co-zrobic-gdy-komornik-zajal-konto", "/pytania", "/pytania/czy-komornik-moze-zajac-cale-konto", "/kategorie/umowy-i-konsumenci", "/jak-to-dziala", "/szukaj?q=komornik", "/admin/login"];

for (const url of PAGES) {
  test(`WCAG 2.2 AA (axe) – ${url}`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("ip_consent_v1", "denied"));
    await page.goto(url);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    const summary = results.violations.map((v) => `${v.id}: ${v.nodes.length} × ${v.nodes[0]?.target.join(" ")}`);
    expect(summary).toEqual([]);
  });
}
