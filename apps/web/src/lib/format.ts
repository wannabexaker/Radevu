/**
 * Formats a cent amount for Greek currency display.
 *
 * @param cents - Amount stored as integer cents.
 * @param currency - ISO currency code, defaulting to EUR.
 * @returns Localized currency text.
 */
export function formatPrice(cents: number, currency = "EUR"): string {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency
  }).format(cents / 100);
}

/**
 * Formats a service duration in concise Greek text.
 *
 * @param minutes - Duration in whole minutes.
 * @returns Human-readable duration text.
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} λεπτά`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return hours === 1 ? "1 ώρα" : `${hours} ώρες`;
  }

  return `${hours}ώ ${remainingMinutes}λ`;
}
