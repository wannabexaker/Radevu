import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { expect, test } from "@playwright/test";

const ownerEmail = "barber@radevu.local";
const ownerPassword = "BarberDev123!";
const execFileAsync = promisify(execFile);

type DateParts = {
  day: number;
  month: number;
  year: number;
};

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

function timeZoneOffsetMs(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone: timezone,
    year: "numeric"
  }).formatToParts(date);

  const getPart = (type: string): number => {
    const value = parts.find((part) => part.type === type)?.value;
    return value ? Number(value) : 0;
  };

  const asUtc = Date.UTC(
    getPart("year"),
    getPart("month") - 1,
    getPart("day"),
    getPart("hour"),
    getPart("minute"),
    getPart("second")
  );

  return asUtc - date.getTime();
}

function todayAtBusinessTime(timezone: string, time: string): Date {
  const parts = datePartsInTimeZone(new Date(), timezone);
  const [hour = 0, minute = 0] = time.split(":").map(Number);
  const initialUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    hour,
    minute,
    0,
    0
  );
  const firstOffset = timeZoneOffsetMs(new Date(initialUtc), timezone);
  const firstUtc = initialUtc - firstOffset;
  const secondOffset = timeZoneOffsetMs(new Date(firstUtc), timezone);

  return new Date(initialUtc - secondOffset);
}

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

async function seedTodayAppointment(): Promise<string> {
  const seedRow = await runPsql(`
    SELECT u.id || '|' || b.id || '|' || b.timezone || '|' || s.id || '|' || s.duration_minutes || '|' || s.price_cents
    FROM users u
    CROSS JOIN businesses b
    JOIN services s ON s.business_id = b.id
    WHERE u.email = ${sqlString(ownerEmail)} AND b.slug = 'test-shop' AND s.active = true
    ORDER BY s.created_at ASC
    LIMIT 1;
  `);
  const [
    ownerId,
    businessId,
    timezone,
    serviceId,
    durationMinutesText,
    priceCentsText
  ] = seedRow.split("|");

  if (
    !ownerId ||
    !businessId ||
    !timezone ||
    !serviceId ||
    !durationMinutesText ||
    !priceCentsText
  ) {
    throw new Error("Seeded owner, test-shop business, or service was not found.");
  }

  await runPsql(`
    UPDATE businesses
    SET owner_id = ${sqlString(ownerId)}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${sqlString(businessId)};
  `);

  const customerName = `Dashboard Test ${Date.now()}`;
  const startsAt = todayAtBusinessTime(timezone, "10:00");
  const durationMinutes = Number(durationMinutesText);
  const priceCents = Number(priceCentsText);
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);
  const uniqueSuffix = Date.now().toString();
  const customerId = `e2e_customer_${uniqueSuffix}`;
  const appointmentId = `e2e_appointment_${uniqueSuffix}`;

  await runPsql(`
    INSERT INTO customers (id, business_id, name, email, phone, updated_at)
    VALUES (
      ${sqlString(customerId)},
      ${sqlString(businessId)},
      ${sqlString(customerName)},
      ${sqlString(`dashboard-${uniqueSuffix}@example.com`)},
      ${sqlString(`69${uniqueSuffix}`)},
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
      'scheduled'::"AppointmentStatus",
      false,
      ${priceCents},
      CURRENT_TIMESTAMP
    );
  `);

  return customerName;
}

test("ο ιδιοκτήτης βλέπει και ενημερώνει σημερινό ραντεβού κάτω από 10 δευτερόλεπτα", async ({
  page
}) => {
  const customerName = await seedTodayAppointment();
  const startedAt = Date.now();

  await page.goto("/dashboard/login");
  await page.getByLabel("Email").fill(ownerEmail);
  await page.getByLabel("Κωδικός").fill(ownerPassword);
  await page.getByRole("button", { name: "Σύνδεση" }).click();
  await page.waitForURL("**/dashboard/today");

  const card = page
    .getByTestId("appointment-card")
    .filter({ hasText: customerName });

  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Έγινε" }).click();
  await expect(card.getByText("Ολοκληρώθηκε")).toBeVisible();
  await expect(page.getByTestId("today-counter")).toContainText(
    "ολοκληρωμένα"
  );

  await card.getByRole("button", { name: "Πληρώθηκε" }).click();
  await expect(card.getByText("Πληρώθηκε")).toBeVisible();

  const totalMs = Date.now() - startedAt;

  if (totalMs >= 10_000) {
    throw new Error(`Dashboard today flow exceeded 10000ms: ${totalMs}ms`);
  }
});
