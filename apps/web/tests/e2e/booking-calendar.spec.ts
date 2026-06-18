import { formatGreekMonth, formatGreekTime } from "@radevu/shared";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { generateSlots } from "../../src/lib/availability";

type MonthCursor = {
  month: number;
  year: number;
};

function cursorInTimeZone(date: Date, timezone: string): MonthCursor {
  const parts = new Intl.DateTimeFormat("en-CA", {
    month: "2-digit",
    timeZone: timezone,
    year: "numeric"
  }).formatToParts(date);

  const getPart = (type: string): number => {
    const value = parts.find((part) => part.type === type)?.value;
    return value ? Number(value) : 0;
  };

  return {
    year: getPart("year"),
    month: getPart("month")
  };
}

function monthLabel(cursor: MonthCursor): string {
  return formatGreekMonth(new Date(Date.UTC(cursor.year, cursor.month - 1, 1, 12)));
}

function addMonths(cursor: MonthCursor, months: number): MonthCursor {
  const shifted = new Date(Date.UTC(cursor.year, cursor.month - 1 + months, 1, 12));

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1
  };
}

function availableDays(page: Page): Locator {
  return page.locator(
    '[data-testid="calendar-day"][data-state="open"], [data-testid="calendar-day"][data-state="available"], [data-testid="calendar-day"][data-state="tight"]'
  );
}

async function clickFirstAvailableDay(page: Page): Promise<void> {
  const days = availableDays(page);
  const count = await days.count();

  for (let index = 0; index < count; index += 1) {
    const day = days.nth(index);

    if (await day.isEnabled()) {
      await day.click();
      return;
    }
  }

  throw new Error("No enabled calendar day with availability was found.");
}

test("το ημερολόγιο μήνα οδηγεί την κράτηση κάτω από 60 δευτερόλεπτα", async ({
  page
}) => {
  const timezone = "Europe/Athens";
  const currentMonth = cursorInTimeZone(new Date(), timezone);
  const nextMonth = addMonths(currentMonth, 1);
  const startedAt = Date.now();

  await page.goto("/qa-demo");
  await page.getByTestId("booking-trigger").click();
  await page.getByTestId("service-option").first().click();

  await expect(page.getByTestId("calendar-month")).toBeVisible();
  await expect(page.getByTestId("calendar-month-header")).toHaveText(
    monthLabel(currentMonth)
  );
  await expect(page.getByTestId("calendar-prev-month")).toBeDisabled();
  await expect(availableDays(page).first()).toBeVisible();

  await page.getByTestId("calendar-next-month").click();
  await expect(page.getByTestId("calendar-month-header")).toHaveText(
    monthLabel(nextMonth)
  );

  await page.getByTestId("calendar-prev-month").click();
  await expect(page.getByTestId("calendar-month-header")).toHaveText(
    monthLabel(currentMonth)
  );
  await expect(page.getByTestId("calendar-prev-month")).toBeDisabled();

  await clickFirstAvailableDay(page);
  await expect(page.getByRole("heading", { name: "Διάλεξε ώρα" })).toBeVisible();
  await expect(page.getByTestId("slot-option").first()).toBeVisible();
  await page.getByTestId("slot-option").first().click();
  await expect(
    page.getByRole("heading", { name: "Τα στοιχεία σου" })
  ).toBeVisible();

  await page.getByLabel("Όνομα").fill("Πελάτης Ημερολογίου");
  await page.getByLabel("Email").fill(`calendar-${Date.now()}@example.com`);
  await page.getByRole("button", { name: "Επιβεβαίωση" }).click();
  await expect(
    page.getByRole("heading", { name: "Έγινε κράτηση!" })
  ).toBeVisible();

  const totalMs = Date.now() - startedAt;

  if (totalMs >= 60_000) {
    throw new Error(`Booking calendar flow exceeded 60000ms: ${totalMs}ms`);
  }
});

test("η παραγωγή ωρών χειρίζεται τις αλλαγές DST στην Ελλάδα", () => {
  const business = {
    timezone: "Europe/Athens",
    workingHours: {
      sun: [{ open: "02:00", close: "04:00" }]
    }
  };
  const service = {
    durationMinutes: 30
  };
  const springLabels = generateSlots(
    business,
    service,
    "2026-03-29",
    []
  ).map((slot) => formatGreekTime(slot.startsAt, business.timezone));
  const fallLabels = generateSlots(
    business,
    service,
    "2026-10-25",
    []
  ).map((slot) => formatGreekTime(slot.startsAt, business.timezone));

  expect(springLabels).not.toContain("03:00");
  expect(fallLabels.filter((label) => label === "02:30")).toHaveLength(1);
});
