import { expect, test } from "@playwright/test";

/**
 * The landing showcase is a recommendation rotation, so neither the order nor
 * the exact membership is fixed — asserting specific slugs here would flake as
 * soon as more than six businesses are published. These assertions cover what
 * must always hold; the deterministic per-business checks moved to the
 * directory test below.
 */
test("landing showcase links through to a live profile", async ({ page }) => {
  test.setTimeout(20_000);
  const startedAt = Date.now();

  await page.goto("/");

  const cards = page.locator('[data-testid="showcase-card"]');
  await expect(cards.first()).toBeVisible();

  const count = await cards.count();
  expect(count).toBeGreaterThan(0);
  expect(count).toBeLessThanOrEqual(6);

  // Every card must point at its own public profile.
  for (let index = 0; index < count; index += 1) {
    const slug = await cards.nth(index).getAttribute("data-slug");
    expect(slug).toBeTruthy();
    await expect(cards.nth(index)).toHaveAttribute("href", `/${slug}`);
  }

  const firstSlug = await cards.first().getAttribute("data-slug");
  await cards.first().click();
  await expect(page).toHaveURL(new RegExp(`/${firstSlug}$`));
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const elapsedMs = Date.now() - startedAt;

  if (elapsedMs > 15_000) {
    throw new Error(`Showcase smoke took ${elapsedMs}ms; expected under 15000ms.`);
  }
});

test("the directory lists the live demo profiles and they open", async ({
  page
}) => {
  await page.goto("/epaggelmaties");

  await expect(page.getByRole("link", { name: /Δέσποινα/ }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Ιωάννης/ }).first()).toBeVisible();

  await page.getByRole("link", { name: /Δέσποινα/ }).first().click();
  await expect(page).toHaveURL(/\/despoina$/);
  await expect(page.getByRole("heading", { name: /Δέσποινα/ })).toBeVisible();
  await expect(page.getByText("Ιδιαίτερο Γυμνασίου")).toBeVisible();

  await page.goto("/epaggelmaties");
  await page.getByRole("link", { name: /Ιωάννης/ }).first().click();
  await expect(page).toHaveURL(/\/ioannis$/);
  await expect(page.getByRole("heading", { name: /Ιωάννης/ })).toBeVisible();
  await expect(page.getByText("Διάγνωση προβλήματος δικτύου")).toBeVisible();
});
