import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const expectedSectionIds = ["istruzione", "esperienze-lavorative", "progetti-formativi", "volontariato", "sport", "corsi", "competenze"];

const mainPages = [
  { route: "/", lang: "it", heading: "Paolo Rossi", annexes: "/annessi/", location: "Merano e Trento, Italia", moreInfo: "Visita il sito per maggiori informazioni." },
  { route: "/en/", lang: "en", heading: "Paolo Rossi", annexes: "/en/appendices/", location: "Merano and Trento, Italy", moreInfo: "Visit the website for more information." },
  { route: "/de/", lang: "de", heading: "Paolo Rossi", annexes: "/de/anhaenge/", location: "Meran und Trient, Italien", moreInfo: "Besuchen Sie die Website, um weitere Informationen zu erhalten." }
];

const annexPages = [
  { route: "/annessi/", lang: "it", heading: "Annessi" },
  { route: "/en/appendices/", lang: "en", heading: "Additional information" },
  { route: "/de/anhaenge/", lang: "de", heading: "Ergänzende Informationen" }
];

for (const pageCase of [...mainPages, ...annexPages]) {
  test(`${pageCase.route} renders with the correct language`, async ({ page }) => {
    const response = await page.goto(pageCase.route);
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator("html")).toHaveAttribute("lang", pageCase.lang);
    await expect(page.getByRole("heading", { level: 1, name: pageCase.heading })).toBeVisible();
    await expect(page.locator("footer")).toContainText(/2026/);
  });
}

for (const pageCase of mainPages) {
  test(`${pageCase.lang} curriculum has complete navigation and no serious accessibility issues`, async ({ page }) => {
    await page.goto(pageCase.route);
    await expect(page.locator(".section-index a")).toHaveCount(7);
    await expect(page.locator(".cv-section")).toHaveCount(7);
    expect(await page.locator(".cv-section").evaluateAll((sections) => sections.map((section) => section.id))).toEqual(expectedSectionIds);
    expect(await page.locator(".section-index a").evaluateAll((links) => links.map((link) => link.getAttribute("href")))).toEqual(expectedSectionIds.map((id) => `#${id}`));
    await expect(page.locator(".tagline")).toHaveCount(0);
    await expect(page.getByText(pageCase.location, { exact: true })).toBeVisible();
    await expect(page.locator(`a[href="${pageCase.annexes}"]`).first()).toBeVisible();
    await expect(page.locator(".print-site-link")).toHaveText(pageCase.moreInfo);

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([]);
  });

  for (const width of [320, 768, 1440]) {
    test(`${pageCase.lang} curriculum does not overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(pageCase.route);
      const dimensions = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
    });
  }
}

test("language switcher preserves page context", async ({ page }) => {
  await page.goto("/annessi/");
  await page.getByRole("navigation", { name: "Lingua" }).getByText("DE").click();
  await expect(page).toHaveURL(/\/de\/anhaenge\/$/);
  await page.getByRole("navigation", { name: "Sprache" }).getByText("EN").click();
  await expect(page).toHaveURL(/\/en\/appendices\/$/);
});

test("keyboard users reach the skip link first", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
});

test("published contact information contains email but no phone link", async ({ page }) => {
  await page.goto("/");
  const emailLink = page.locator('a[href^="mailto:"]');
  await expect(emailLink).toHaveCount(1);
  await expect(emailLink).toHaveCSS("white-space", "nowrap");
  await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
  await expect(page.locator('.print-footer a[href="https://paoloros.github.io"]')).toHaveCount(1);
});

test("annex pages do not display a subtitle", async ({ page }) => {
  await page.goto("/annessi/");
  await expect(page.locator(".annex-hero > p:not(.eyebrow)")).toHaveCount(0);
  await expect(page.locator(".annex")).toHaveCount(6);
  await expect(page.locator("#corsi-vvff")).toHaveCount(0);
});
