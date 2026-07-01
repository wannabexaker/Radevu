import { expect, test } from "@playwright/test";

test("landing showcase links to the two live demo profiles", async ({
  page
}) => {
  test.setTimeout(20_000);
  const startedAt = Date.now();

  await page.goto("/");

  const despoinaCard = page.locator(
    '[data-testid="showcase-card"][data-slug="despoina"]'
  );
  const ioannisCard = page.locator(
    '[data-testid="showcase-card"][data-slug="ioannis"]'
  );

  await expect(despoinaCard).toBeVisible();
  await expect(ioannisCard).toBeVisible();
  await expect(despoinaCard).toHaveAttribute("href", "/despoina");
  await expect(ioannisCard).toHaveAttribute("href", "/ioannis");

  await despoinaCard.click();
  await expect(page).toHaveURL(/\/despoina$/);
  await expect(page.getByRole("heading", { name: /Δέσποινα/ })).toBeVisible();
  await expect(page.getByText("Ιδιαίτερο Γυμνασίου")).toBeVisible();

  await page.goBack();
  await ioannisCard.click();
  await expect(page).toHaveURL(/\/ioannis$/);
  await expect(page.getByRole("heading", { name: /Ιωάννης/ })).toBeVisible();
  await expect(page.getByText("Διάγνωση προβλήματος δικτύου")).toBeVisible();

  const elapsedMs = Date.now() - startedAt;

  if (elapsedMs > 15_000) {
    throw new Error(`Showcase smoke took ${elapsedMs}ms; expected under 15000ms.`);
  }
});
