import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { expect, test } from "@playwright/test";

/**
 * Covers Chunk #16: search analytics logging, the founder-only insights gate,
 * and the recommendation endpoint.
 */

const execFileAsync = promisify(execFile);

async function runPsql(sql: string): Promise<string> {
  const result = await execFileAsync("docker", [
    "exec",
    "-i",
    "radevu-postgres",
    "psql",
    "-U",
    "radevu",
    "-d",
    "radevu",
    "-A",
    "-t",
    "-c",
    sql
  ]);

  return result.stdout.trim();
}

async function searchEventCount(query: string): Promise<number> {
  const raw = await runPsql(
    `SELECT count(*) FROM search_events WHERE query = '${query}';`
  );
  return Number(raw);
}

test("a directory search is logged, and plain browsing is not", async ({
  page
}) => {
  const term = `e2e-search-${Date.now()}`;

  const browseBefore = await runPsql("SELECT count(*) FROM search_events;");
  await page.goto("/epaggelmaties");
  const browseAfter = await runPsql("SELECT count(*) FROM search_events;");

  // Opening the directory without searching must not create an event.
  expect(Number(browseAfter)).toBe(Number(browseBefore));

  await page.goto(`/epaggelmaties?search=${term}`);
  await expect(page.getByRole("heading", { name: "Επαγγελματίες" })).toBeVisible();

  await expect.poll(async () => searchEventCount(term)).toBe(1);

  // Paging through the same search must not double-count it.
  await page.goto(`/epaggelmaties?search=${term}&cursor=someid`);
  await expect.poll(async () => searchEventCount(term)).toBe(1);

  const zeroResults = await runPsql(
    `SELECT results_count FROM search_events WHERE query = '${term}';`
  );
  expect(Number(zeroResults)).toBe(0);

  await runPsql(`DELETE FROM search_events WHERE query = '${term}';`);
});

test("search terms are normalised so variants aggregate", async ({ page }) => {
  const term = `e2e-case-${Date.now()}`;

  await page.goto(`/epaggelmaties?search=${term.toUpperCase()}`);
  await page.goto(`/epaggelmaties?search=%20%20${term}%20%20`);

  await expect.poll(async () => searchEventCount(term)).toBe(2);

  await runPsql(`DELETE FROM search_events WHERE query = '${term}';`);
});

test("the insights page is hidden from anyone but the founder", async ({
  page
}) => {
  const response = await page.goto("/insights");

  // 404, not 403 — a stranger should not learn that the page exists.
  expect(response?.status()).toBe(404);
});

test("recommendations are public and only include bookable businesses", async ({
  request
}) => {
  const response = await request.get("/api/v1/businesses/recommended?limit=3");
  expect(response.status()).toBe(200);

  const payload = (await response.json()) as {
    businesses: { category: string | null; slug: string }[];
    reason: string;
  };

  expect(payload.reason).toBe("random");
  expect(payload.businesses.length).toBeGreaterThan(0);
  expect(payload.businesses.length).toBeLessThanOrEqual(3);

  for (const business of payload.businesses) {
    expect(business.slug).toBeTruthy();
    expect(business.category).not.toBeNull();
  }

  const bad = await request.get("/api/v1/businesses/recommended?limit=abc");
  expect(bad.status()).toBe(400);
});
