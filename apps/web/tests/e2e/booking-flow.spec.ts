import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * Run with: docker compose up -d, then pnpm --filter @radevu/web test:e2e.
 * Requires seeded qa-demo business.
 */

type StepTiming = {
  name: string;
  durationMs: number;
};

async function timedStep(
  timings: StepTiming[],
  name: string,
  action: () => Promise<void>
): Promise<void> {
  const startedAt = Date.now();
  await action();
  timings.push({
    name,
    durationMs: Date.now() - startedAt
  });
}

async function clickFutureEnabledDate(page: Page): Promise<void> {
  const dateOptions = page.locator(
    '[data-testid="calendar-day"][data-state="open"], [data-testid="calendar-day"][data-state="available"], [data-testid="calendar-day"][data-state="tight"]'
  );
  const count = await dateOptions.count();

  for (let index = 0; index < count; index += 1) {
    const option = dateOptions.nth(index);

    if (await option.isEnabled()) {
      await option.click();
      return;
    }
  }

  throw new Error("No enabled future date found for seeded business.");
}

function slowestStep(timings: StepTiming[]): StepTiming {
  return timings.reduce((slowest, timing) =>
    timing.durationMs > slowest.durationMs ? timing : slowest
  );
}

function formatTimings(timings: StepTiming[]): string {
  return timings
    .map((timing) => `step ${timing.name} took ${timing.durationMs}ms`)
    .join("; ");
}

async function expectVisible(locator: Locator): Promise<void> {
  await expect(locator).toBeVisible();
}

test("η δημόσια ροή κράτησης ολοκληρώνεται κάτω από 60 δευτερόλεπτα", async ({
  page
}) => {
  const timings: StepTiming[] = [];

  await page.goto("/qa-demo");
  await expectVisible(
    page.getByRole("heading", {
      name: "QA Demo"
    })
  );

  const flowStartedAt = Date.now();

  await timedStep(timings, "άνοιγμα modal", async () => {
    await page.getByTestId("booking-trigger").click();
    await expectVisible(
      page.getByRole("heading", {
        name: "Διάλεξε υπηρεσία"
      })
    );
  });

  await timedStep(timings, "επιλογή υπηρεσίας", async () => {
    await page.getByTestId("service-option").first().click();
    await expectVisible(
      page.getByRole("heading", {
        name: "Διάλεξε ημέρα"
      })
    );
    await expectVisible(page.getByTestId("calendar-month"));
  });

  await timedStep(timings, "επιλογή ημέρας", async () => {
    await clickFutureEnabledDate(page);
    await expectVisible(
      page.getByRole("heading", {
        name: "Διάλεξε ώρα"
      })
    );
  });

  await timedStep(timings, "φόρτωση και επιλογή ώρας", async () => {
    await expect(page.getByTestId("slot-option").first()).toBeVisible();
    await page.getByTestId("slot-option").first().click();
    await expectVisible(
      page.getByRole("heading", {
        name: "Τα στοιχεία σου"
      })
    );
  });

  await timedStep(timings, "συμπλήρωση στοιχείων", async () => {
    await page.getByLabel("Όνομα").fill("Πελάτης Δοκιμής");
    await page
      .getByLabel("Email")
      .fill(`booking-${Date.now()}@example.com`);
    await page.getByRole("button", { name: "Επιβεβαίωση" }).click();
    await expectVisible(
      page.getByRole("heading", {
        name: "Έγινε κράτηση!"
      })
    );
  });

  const totalMs = Date.now() - flowStartedAt;

  if (totalMs >= 60_000) {
    const slowest = slowestStep(timings);
    throw new Error(
      `Booking flow exceeded 60000ms: step ${slowest.name} took ${slowest.durationMs}ms. ${formatTimings(timings)}`
    );
  }

  await expect(page.getByText("Στείλαμε επιβεβαίωση στο"))
    .toBeVisible();
});
