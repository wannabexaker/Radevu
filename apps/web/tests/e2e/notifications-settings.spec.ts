import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { expect, test } from "@playwright/test";

const ownerEmail = "barber@radevu.local";
const ownerPassword = "BarberDev123!";
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

function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

async function resetNotificationSettings(): Promise<void> {
  const seedRow = await runPsql(`
    SELECT u.id || '|' || b.id
    FROM users u
    CROSS JOIN businesses b
    WHERE u.email = ${sqlString(ownerEmail)} AND b.slug = 'test-shop'
    LIMIT 1;
  `);
  const [ownerId, businessId] = seedRow.split("|");

  if (!ownerId || !businessId) {
    throw new Error("Seeded owner or test-shop business was not found.");
  }

  await runPsql(`
    UPDATE businesses
    SET
      owner_id = ${sqlString(ownerId)},
      notification_settings = '{"confirmation_enabled":true,"reminder_enabled":true,"reminder_lead_minutes":1440}'::jsonb,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${sqlString(businessId)};
  `);
}

test("ο ιδιοκτήτης αποθηκεύει ρυθμίσεις ειδοποιήσεων κάτω από 20 δευτερόλεπτα", async ({
  page
}) => {
  await resetNotificationSettings();
  const startedAt = Date.now();

  await page.goto("/dashboard/login");
  await page.getByLabel("Email").fill(ownerEmail);
  await page.getByLabel("Κωδικός").fill(ownerPassword);
  await page.getByRole("button", { name: "Σύνδεση" }).click();
  await page.waitForURL("**/dashboard/today");

  await page.getByRole("link", { name: "Ειδοπ." }).click();
  await expect(
    page.getByRole("heading", { name: "Ειδοποιήσεις" })
  ).toBeVisible();
  await expect(page.getByTestId("notifications-confirmation-switch")).toHaveAttribute(
    "data-state",
    "checked"
  );
  await expect(page.getByTestId("notifications-reminder-switch")).toHaveAttribute(
    "data-state",
    "checked"
  );
  await expect(
    page.locator('input[name="reminder_lead_minutes"][value="1440"]')
  ).toBeChecked();

  await page.getByTestId("notifications-reminder-switch").click();
  await page.getByTestId("notifications-save").click();
  await expect(page.getByText("Αποθηκεύτηκε")).toBeVisible();

  await page.reload();
  await expect(page.getByTestId("notifications-reminder-switch")).toHaveAttribute(
    "data-state",
    "unchecked"
  );
  await expect(page.getByTestId("lead-time-2880")).toBeHidden();

  await page.getByTestId("notifications-reminder-switch").click();
  await page.getByTestId("lead-time-2880").click();
  await page.getByTestId("notifications-save").click();
  await expect(page.getByText("Αποθηκεύτηκε")).toBeVisible();

  await page.reload();
  await expect(page.getByTestId("notifications-reminder-switch")).toHaveAttribute(
    "data-state",
    "checked"
  );
  await expect(
    page.locator('input[name="reminder_lead_minutes"][value="2880"]')
  ).toBeChecked();

  const totalMs = Date.now() - startedAt;

  if (totalMs >= 20_000) {
    throw new Error(
      `Notifications settings flow exceeded 20000ms: ${totalMs}ms`
    );
  }
});
