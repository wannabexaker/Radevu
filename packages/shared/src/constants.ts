export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  "www",
  "app",
  "api",
  "admin",
  "account",
  "dashboard",
  "login",
  "mail",
  "register",
  "status",
  "radevu",
  "static",
  "assets",
  "verify-email"
]);

// Demo slugs are pre-claimed by the founder for live demos. Real customers
// with these first names should use a city or descriptor suffix, e.g. despoina-athens.
export const RESERVED_DEMO_SLUGS: ReadonlySet<string> = new Set([
  "ioannis",
  "giannis",
  "despoina"
]);

export const BUSINESS_SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
export const BUSINESS_SLUG_MAX_LENGTH = 40;
