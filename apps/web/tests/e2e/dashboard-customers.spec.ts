import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { expect, test } from "@playwright/test";

const ownerEmail = "dimos.is.dev+qa@gmail.com";
const ownerPassword = "QaDemo2026!";
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

function sqlTimestamp(date: Date): string {
  return date.toISOString().replace("T", " ").replace("Z", "");
}

async function seedCustomerWithBooking(): Promise<string> {
  const seedRow = await runPsql(`
    SELECT u.id || '|' || b.id || '|' || s.id || '|' || s.duration_minutes || '|' || s.price_cents
    FROM users u
    CROSS JOIN businesses b
    JOIN services s ON s.business_id = b.id
    WHERE u.email = ${sqlString(ownerEmail)} AND b.slug = 'qa-demo' AND s.active = true
    ORDER BY s.created_at ASC
    LIMIT 1;
  `);
  const [ownerId, businessId, serviceId, durationMinutesText, priceCentsText] =
    seedRow.split("|");

  if (!ownerId || !businessId || !serviceId || !durationMinutesText || !priceCentsText) {
    throw new Error("Seeded owner, qa-demo business, or service was not found.");
  }

  await runPsql(`
    UPDATE businesses
    SET owner_id = ${sqlString(ownerId)}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${sqlString(businessId)};
  `);

  const uniqueSuffix = Date.now().toString();
  const customerName = `Πελάτης CRM ${uniqueSuffix}`;
  const customerId = `e2e_customer_crm_${uniqueSuffix}`;
  const appointmentId = `e2e_appointment_crm_${uniqueSuffix}`;
  const startsAt = new Date(Date.now() - 24 * 60 * 60_000);
  const endsAt = new Date(
    startsAt.getTime() + Number(durationMinutesText) * 60_000
  );

  await runPsql(`
    INSERT INTO customers (id, business_id, name, email, phone, updated_at)
    VALUES (
      ${sqlString(customerId)},
      ${sqlString(businessId)},
      ${sqlString(customerName)},
      ${sqlString(`crm-${uniqueSuffix}@example.com`)},
      ${sqlString(`68${uniqueSuffix}`)},
      CURRENT_TIMESTAMP
    );

    INSERT INTO appointments (
      id,
      business_id,
      customer_id,
      service_id,
      starts_at,
      ends_at,
      status,
      paid,
      amount_due_cents,
      updated_at
    )
    VALUES (
      ${sqlString(appointmentId)},
      ${sqlString(businessId)},
      ${sqlString(customerId)},
      ${sqlString(serviceId)},
      TIMESTAMP ${sqlString(sqlTimestamp(startsAt))},
      TIMESTAMP ${sqlString(sqlTimestamp(endsAt))},
      'done'::"AppointmentStatus",
      true,
      ${Number(priceCentsText)},
      CURRENT_TIMESTAMP
    );
  `);

  return customerName;
}

test("ο ιδιοκτήτης βλέπει πελάτη και αποθηκεύει σημείωση κάτω από 15 δευτερόλεπτα", async ({
  page
}) => {
  const customerName = await seedCustomerWithBooking();
  const note = `Σημείωση ${Date.now()}`;
  const startedAt = Date.now();

  await page.goto("/dashboard/login");
  await page.getByLabel("Email").fill(ownerEmail);
  await page.getByLabel("Κωδικός").fill(ownerPassword);
  await page.getByRole("button", { name: "Σύνδεση" }).click();
  await page.waitForURL("**/dashboard/today");

  await page.goto("/dashboard/customers");
  await expect(page.getByText(customerName)).toBeVisible();
  await page.getByText(customerName).click();
  await expect(page.getByRole("heading", { name: customerName })).toBeVisible();
  await expect(page.getByText("Ιστορικό κρατήσεων")).toBeVisible();

  await page.getByLabel("Σημειώσεις για τον πελάτη").fill(note);
  await page.getByRole("button", { name: "Αποθήκευση" }).click();
  await expect(page.getByText("Αποθηκεύτηκε")).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Σημειώσεις για τον πελάτη")).toHaveValue(note);

  const totalMs = Date.now() - startedAt;

  if (totalMs >= 15_000) {
    throw new Error(`Dashboard customers flow exceeded 15000ms: ${totalMs}ms`);
  }
});
