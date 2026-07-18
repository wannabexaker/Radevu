/**
 * Formats an ISO date (YYYY-MM-DD) as a Greek long date for legal documents.
 *
 * @param isoDate - Date in YYYY-MM-DD form, e.g. a value from LEGAL_VERSIONS.
 * @returns The date written out in Greek, e.g. "18 Ιουλίου 2026".
 */
export function formatLegalDate(isoDate: string): string {
  return new Intl.DateTimeFormat("el-GR", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Athens",
    year: "numeric"
  }).format(new Date(`${isoDate}T00:00:00Z`));
}
