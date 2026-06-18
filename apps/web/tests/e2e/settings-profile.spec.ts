/**
 * Run with: docker compose up -d, then pnpm --filter @radevu/web test:e2e.
 * Requires seeded qa-demo business.
 */
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { expect, test } from "@playwright/test";

const ownerEmail = "dimos.is.dev+qa@gmail.com";
const ownerPassword = "QaDemo2026!";
const execFileAsync = promisify(execFile);
const tinyPngPath = path.join(__dirname, "..", "fixtures", "tiny.png");

type DateParts = {
  day: number;
  month: number;
  year: number;
};

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

function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function datePartsInTimeZone(date: Date, timezone: string): DateParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric"
  }).formatToParts(date);

  const getPart = (type: string): number => {
    const value = parts.find((part) => part.type === type)?.value;
    return value ? Number(value) : 0;
  };

  return {
    day: getPart("day"),
    month: getPart("month"),
    year: getPart("year")
  };
}

function nextSundayParts(timezone: string): DateParts {
  const now = new Date();
  const nextSunday = new Date(now);
  const daysUntilSunday = (7 - now.getDay()) % 7;
  nextSunday.setDate(now.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));

  return datePartsInTimeZone(nextSunday, timezone);
}

async function resetSettingsBusiness(): Promise<{
  businessId: string;
  timezone: string;
}> {
  const seedRow = await runPsql(`
    SELECT u.id || '|' || b.id || '|' || b.timezone
    FROM users u
    CROSS JOIN businesses b
    WHERE u.email = ${sqlString(ownerEmail)} AND b.slug = 'qa-demo'
    LIMIT 1;
  `);
  const [ownerId, businessId, timezone] = seedRow.split("|");

  if (!ownerId || !businessId || !timezone) {
    throw new Error("Seeded owner or qa-demo business was not found.");
  }

  const workingHours = JSON.stringify({
    fri: [{ close: "19:00", open: "09:00" }],
    mon: [{ close: "19:00", open: "09:00" }],
    sat: [{ close: "15:00", open: "09:00" }],
    sun: [],
    thu: [{ close: "19:00", open: "09:00" }],
    tue: [{ close: "19:00", open: "09:00" }],
    wed: [{ close: "19:00", open: "09:00" }]
  });

  await runPsql(`
    UPDATE businesses
    SET
      owner_id = ${sqlString(ownerId)},
      name = ${sqlString("QA Demo")},
      contact_email = NULL,
      contact_phone = NULL,
      logo_url = NULL,
      photo_url = NULL,
      maps_url = NULL,
      social_links = '{}'::jsonb,
      working_hours = ${sqlString(workingHours)}::jsonb,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${sqlString(businessId)};
  `);

  return {
    businessId,
    timezone
  };
}

test.afterEach(async () => {
  await resetSettingsBusiness();
});

test("ο ιδιοκτήτης ενημερώνει προφίλ και Κυριακή για κρατήσεις κάτω από 30 δευτερόλεπτα", async ({
  page
}) => {
  const { timezone } = await resetSettingsBusiness();
  const businessName = `QA Demo Ρυθμίσεων ${Date.now()}`;
  const businessEmail = `settings-${Date.now()}@example.com`;
  const startedAt = Date.now();

  await page.goto("/dashboard/login");
  await page.getByLabel("Email").fill(ownerEmail);
  await page.getByLabel("Κωδικός").fill(ownerPassword);
  await page.getByRole("button", { name: "Σύνδεση" }).click();
  await page.waitForURL("**/dashboard/today");

  await page.goto("/dashboard/settings");
  await page.getByRole("link", { name: /Προφίλ/ }).click();
  await expect(
    page.getByRole("heading", { exact: true, name: "Προφίλ" })
  ).toBeVisible();

  await page.getByTestId("logo-file-input").setInputFiles(tinyPngPath);
  await page.getByTestId("logo-upload-button").click();
  await expect(page.getByText("Αποθηκεύτηκε")).toBeVisible();

  await page.getByTestId("settings-profile-name").fill(businessName);
  await page.getByTestId("settings-profile-phone").fill("2101234567");
  await page.getByTestId("settings-profile-email").fill(businessEmail);
  await page
    .getByTestId("settings-profile-maps")
    .fill("https://maps.app.goo.gl/radevu-test");
  await page
    .getByTestId("settings-profile-instagram")
    .fill("https://instagram.com/radevu_test");
  await page
    .getByTestId("settings-profile-facebook")
    .fill("https://facebook.com/radevu.test");
  await page.getByTestId("settings-profile-save").click();
  await expect(page.getByText("Οι αλλαγές αποθηκεύτηκαν.")).toBeVisible();

  await page.goto("/qa-demo");
  await expect(page.getByRole("heading", { name: businessName })).toBeVisible();
  await expect(page.getByText(businessEmail)).toBeVisible();
  await expect(page.getByAltText(`${businessName} λογότυπο`)).toBeVisible();

  await page.goto("/dashboard/settings");
  await page.getByRole("link", { name: /Ωράριο λειτουργίας/ }).click();
  const sundayCard = page.getByTestId("hours-day-sun");
  await expect(sundayCard).toBeVisible();

  const sundaySwitch = sundayCard.getByRole("switch", {
    name: "Κυριακή ανοιχτά"
  });

  if ((await sundaySwitch.getAttribute("data-state")) !== "checked") {
    await sundaySwitch.click();
  }

  await sundayCard.getByLabel("Από").first().fill("10:00");
  await sundayCard.getByLabel("Έως").first().fill("14:00");
  await page.getByTestId("settings-hours-save").click();
  await expect(page.getByText("Το ωράριο αποθηκεύτηκε.")).toBeVisible();

  await page.goto("/qa-demo");
  await page.getByTestId("booking-trigger").click();
  await page.getByTestId("service-option").first().click();

  const todayParts = datePartsInTimeZone(new Date(), timezone);
  const sundayParts = nextSundayParts(timezone);

  if (
    todayParts.month !== sundayParts.month ||
    todayParts.year !== sundayParts.year
  ) {
    await page.getByTestId("calendar-next-month").click();
  }

  const sundayButton = page.getByRole("button", {
    name: new RegExp(`^${sundayParts.day}, `)
  });
  await expect(sundayButton).toBeEnabled();
  await expect(sundayButton).not.toHaveAttribute("data-state", "closed");
  await expect(sundayButton.getByTestId("calendar-day-dot")).toBeVisible();

  const totalMs = Date.now() - startedAt;

  if (totalMs >= 30_000) {
    throw new Error(`Settings profile flow exceeded 30000ms: ${totalMs}ms`);
  }
});
