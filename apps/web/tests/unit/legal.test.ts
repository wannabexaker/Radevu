import assert from "node:assert/strict";
import test from "node:test";

type LegalFormatModule = typeof import("../../src/lib/legal/format");

async function loadLegalFormat(): Promise<LegalFormatModule> {
  const moduleUrl = new URL("../../src/lib/legal/format.ts", import.meta.url)
    .href;

  return (await import(moduleUrl)) as LegalFormatModule;
}

test("legal dates render in Greek long form", async () => {
  const { formatLegalDate } = await loadLegalFormat();

  assert.equal(formatLegalDate("2026-07-18"), "18 Ιουλίου 2026");
  assert.equal(formatLegalDate("2027-01-01"), "1 Ιανουαρίου 2027");
});

test("legal dates are stable across the day boundary in Athens", async () => {
  const { formatLegalDate } = await loadLegalFormat();

  // Guards against a UTC-midnight parse drifting back a day once rendered in
  // Europe/Athens, which would silently mislabel a document version.
  assert.equal(formatLegalDate("2026-12-31"), "31 Δεκεμβρίου 2026");
});
