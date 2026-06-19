import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { render } from "@react-email/components";
import ts from "typescript";

const require = createRequire(import.meta.url);
const packageRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const moduleCache = new Map<string, { exports: Record<string, unknown> }>();

function resolveLocalModule(fromFile: string, specifier: string): string {
  const resolved = path.resolve(path.dirname(fromFile), specifier);

  if (resolved.endsWith(".js")) {
    return `${resolved.slice(0, -3)}.tsx`;
  }

  return resolved;
}

function loadTsxModule(filePath: string): Record<string, unknown> {
  const absolutePath = path.resolve(filePath);
  const cached = moduleCache.get(absolutePath);

  if (cached) {
    return cached.exports;
  }

  const module = { exports: {} as Record<string, unknown> };
  moduleCache.set(absolutePath, module);
  const source = readFileSync(absolutePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    },
    fileName: absolutePath
  }).outputText;
  const localRequire = (specifier: string): unknown =>
    specifier.startsWith(".")
      ? loadTsxModule(resolveLocalModule(absolutePath, specifier))
      : require(specifier);
  const evaluate = new Function(
    "require",
    "module",
    "exports",
    "__filename",
    "__dirname",
    output
  );

  evaluate(
    localRequire,
    module,
    module.exports,
    absolutePath,
    path.dirname(absolutePath)
  );
  return module.exports;
}

type Template = (props: Record<string, unknown>) => React.ReactElement;

function template(name: string): Template {
  const exports = loadTsxModule(
    path.join(packageRoot, "src", "templates", `${name}.tsx`)
  );
  return exports[name] as Template;
}

const samples = [
  {
    component: template("BookingConfirmation")({
      business_email: "info@example.com",
      business_maps_url: "https://example.com/map",
      business_name: "Επιχείρηση Δοκιμής",
      business_phone: "2100000000",
      customer_name: "Μαρία",
      duration_minutes: 60,
      formatted_date: "Δευτέρα 22 Ιουνίου",
      formatted_price: "€50",
      formatted_time: "10:00",
      cancel_url: "https://example.com/action#cancel",
      manage_url: "https://example.com/manage",
      note: "Δοκιμαστική σημείωση",
      reschedule_url: "https://example.com/action#reschedule",
      service_name: "Έλεγχος"
    }),
    expected: "Έγινε η κράτηση!",
    name: "BookingConfirmation"
  },
  {
    component: template("OwnerCancellationAlert")({
      business_name: "Επιχείρηση Δοκιμής",
      customer_name: "Μαρία",
      dashboard_url: "https://example.com/dashboard",
      formatted_date_time: "Δευτέρα 22 Ιουνίου, 10:00",
      reason: "Δεν θα μπορέσω να έρθω.",
      service_name: "Έλεγχος"
    }),
    expected: "Λόγος ακύρωσης",
    name: "OwnerCancellationAlert"
  },
  {
    component: template("OwnerRescheduleRequest")({
      customer_name: "Μαρία",
      dashboard_url: "https://example.com/dashboard",
      formatted_current: "Δευτέρα 22 Ιουνίου, 10:00",
      formatted_requested: "Τρίτη 23 Ιουνίου, 11:00",
      service_name: "Έλεγχος"
    }),
    expected: "Προτεινόμενη ώρα",
    name: "OwnerRescheduleRequest"
  },
  {
    component: template("CustomerRescheduleApproved")({
      business_name: "Επιχείρηση Δοκιμής",
      customer_name: "Μαρία",
      formatted_date_time: "Τρίτη 23 Ιουνίου, 11:00",
      service_name: "Έλεγχος"
    }),
    expected: "Η αλλαγή ώρας εγκρίθηκε",
    name: "CustomerRescheduleApproved"
  },
  {
    component: template("CustomerRescheduleRejected")({
      business_name: "Επιχείρηση Δοκιμής",
      customer_name: "Μαρία",
      formatted_date_time: "Δευτέρα 22 Ιουνίου, 10:00",
      service_name: "Έλεγχος"
    }),
    expected: "Το αίτημα δεν εγκρίθηκε",
    name: "CustomerRescheduleRejected"
  },
  {
    component: template("OwnerNewBookingAlert")({
      business_name: "Επιχείρηση Δοκιμής",
      customer_email: "maria@example.com",
      customer_name: "Μαρία",
      customer_phone: "6900000000",
      dashboard_url: "https://example.com/dashboard",
      formatted_date: "Δευτέρα 22 Ιουνίου",
      formatted_price: "€50",
      formatted_time: "10:00",
      note: "Δοκιμαστική σημείωση",
      service_name: "Έλεγχος"
    }),
    expected: "Νέα κράτηση",
    name: "OwnerNewBookingAlert"
  },
  {
    component: template("BookingReminder")({
      business_email: "info@example.com",
      business_maps_url: "https://example.com/map",
      business_name: "Επιχείρηση Δοκιμής",
      business_phone: "2100000000",
      customer_name: "Μαρία",
      formatted_date: "αύριο",
      formatted_time: "10:00",
      service_name: "Έλεγχος"
    }),
    expected: "Η κράτησή σου πλησιάζει",
    name: "BookingReminder"
  },
  {
    component: template("EmailVerification")({
      name: "Μαρία",
      verification_url: "https://example.com/verify"
    }),
    expected: "Επιβεβαίωσε το Email σου",
    name: "EmailVerification"
  },
  {
    component: template("ResetPassword")({
      name: "Μαρία",
      reset_url: "https://example.com/reset"
    }),
    expected: "Αλλαγή κωδικού",
    name: "ResetPassword"
  },
  {
    component: template("ContactRequestNotification")({
      email: "maria@example.com",
      message: "Θέλω περισσότερες πληροφορίες.",
      name: "Μαρία",
      phone: "6900000000"
    }),
    expected: "Νέο αίτημα επικοινωνίας",
    name: "ContactRequestNotification"
  }
] as const;

describe("Radevu email templates", () => {
  for (const sample of samples) {
    it(`renders ${sample.name} with shared Greek branding`, async () => {
      const html = await render(sample.component);

      assert.match(html, /<html[^>]*lang="el"/);
      assert.match(html, /Radevu · Διαδικτυακά ραντεβού/);
      assert.match(html, /border-left-width:4px/);
      assert.match(html, /background-color:rgb\(255,255,255\)/);
      assert.match(html, new RegExp(sample.expected));
      assert.doesNotMatch(html, /online|contact request|landing page/i);
    });
  }

  it("renders a non-empty email verification body", async () => {
    const verificationUrl = "https://example.com/verify/body-probe";
    const html = await render(
      template("EmailVerification")({
        name: "Μαρία",
        verification_url: verificationUrl
      })
    );
    const containsLink = html.includes(verificationUrl);

    console.info(
      `[email-render-probe] html_length=${html.length} contains_link=${containsLink}`
    );
    assert.ok(
      html.length > 1_000,
      `Expected rendered HTML body, got ${html.length} bytes`
    );
    assert.match(html, /Επιβεβαίωσε/);
    assert.equal(containsLink, true);
  });
});
