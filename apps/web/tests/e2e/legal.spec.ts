import { expect, test } from "@playwright/test";

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
