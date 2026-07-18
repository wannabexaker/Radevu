import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { expect, test } from "@playwright/test";

const execFileAsync = promisify(execFile);
const ownerEmail = "dimos.is.dev+qa@gmail.com";
const ownerPassword = "QaDemo2026!";

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

/**
 * Puts the seeded owner back to "never accepted", so the prompt is reachable
 * no matter how many times this suite has run against the same database.
 */
async function clearOwnerAcceptance(): Promise<void> {
  await runPsql(`
    UPDATE users
    SET terms_accepted_at = NULL, terms_version = NULL, privacy_version = NULL
    WHERE email = '${ownerEmail}';
  `);
}

/**
 * Covers the legal documents and the terms-acceptance gate on the two public
 * write endpoints. Schema validation runs before any anti-abuse or database
 * work, so these requests never create anything.
 */

const dummyCuid = "clh1a2b3c4d5e6f7g8h9i0jk";

test("the legal documents render with their versions and cross-links", async ({
  page
}) => {
  await page.goto("/legal/terms");
  await expect(
    page.getByRole("heading", { level: 1, name: "Όροι Χρήσης" })
  ).toBeVisible();
  await expect(page.getByText(/Τελευταία ενημέρωση:/)).toBeVisible();
  await expect(
    page.getByText(/δεν είναι συμβαλλόμενο μέρος/)
  ).toBeVisible();

  await page.getByRole("link", { name: /Πολιτική Απορρήτου/ }).first().click();
  await expect(page).toHaveURL(/\/legal\/privacy$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Πολιτική Απορρήτου" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "5. Δεν πουλάμε τα δεδομένα σου" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "1. Υπεύθυνος επεξεργασίας" })
  ).toBeVisible();
});

test("registration is blocked without an explicit acceptance", async ({
  request
}) => {
  const body = {
    email: "terms-gate@example.com",
    form_started_at: Date.now() - 10_000,
    honeypot: "",
    name: "Δοκιμή Όρων",
    password: "supersecret1",
    turnstile_token: "dummy-token",
    user_type: "customer"
  };

  const declined = await request.post("/api/v1/auth/register", {
    data: { ...body, accepted_terms: false }
  });
  expect(declined.status()).toBe(400);
  const declinedPayload = (await declined.json()) as {
    error?: { code?: string };
  };
  expect(declinedPayload.error?.code).toBe("VALIDATION_ERROR");

  const missing = await request.post("/api/v1/auth/register", { data: body });
  expect(missing.status()).toBe(400);
});

test("guest booking is blocked without an explicit acceptance", async ({
  request
}) => {
  const body = {
    business_id: dummyCuid,
    customer: {
      name: "Δοκιμή",
      phone: "6900000000"
    },
    service_id: dummyCuid,
    starts_at: new Date(Date.now() + 86_400_000).toISOString()
  };

  const declined = await request.post("/api/v1/appointments", {
    data: { ...body, accepted_terms: false }
  });
  expect(declined.status()).toBe(400);
  const declinedPayload = (await declined.json()) as {
    error?: { code?: string };
  };
  expect(declinedPayload.error?.code).toBe("VALIDATION_ERROR");

  const missing = await request.post("/api/v1/appointments", { data: body });
  expect(missing.status()).toBe(400);
});

test("an account that never accepted is prompted, and accepting clears it", async ({
  page
}) => {
  await clearOwnerAcceptance();

  await page.goto("/dashboard/login");
  await page.getByLabel("Email").fill(ownerEmail);
  await page.getByLabel("Κωδικός").fill(ownerPassword);
  await page.getByRole("button", { name: "Σύνδεση" }).click();
  await page.waitForURL("**/dashboard/today");

  const prompt = page.getByRole("heading", { name: "Ενημερώσαμε τους όρους" });
  const accept = page.getByRole("button", { name: "Αποδέχομαι" });

  // The seeded owner predates terms capture, so the prompt must be there.
  await expect(prompt).toBeVisible();

  // The box is required: submitting without ticking must not record anything.
  await accept.click();
  await expect(prompt).toBeVisible();

  await page.getByRole("checkbox", { name: /αποδέχομαι τους/i }).check();
  await accept.click();

  await expect(prompt).toBeHidden();

  // And it stays gone on the next render, i.e. it was actually persisted.
  await page.reload();
  await expect(prompt).toBeHidden();
});

test("the registration checkbox starts unchecked and gates submission", async ({
  page
}) => {
  await page.goto("/register");
  const acceptance = page.getByRole("checkbox", {
    name: /αποδέχομαι τους/i
  });

  await expect(acceptance).toBeVisible();
  await expect(acceptance).not.toBeChecked();
  await expect(
    page.getByRole("button", { name: "Δημιουργία λογαριασμού" })
  ).toBeDisabled();
});
