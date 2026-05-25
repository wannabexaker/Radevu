import { RESERVED_SLUGS } from "@radevu/shared";

export type RoutingMode = "subpath" | "subdomain";

function stripPort(value: string): string {
  const trimmed = value.trim().toLowerCase();

  if (trimmed.startsWith("[") && trimmed.includes("]")) {
    return trimmed.slice(0, trimmed.indexOf("]") + 1);
  }

  return trimmed.split(":")[0] ?? "";
}

/**
 * Extracts a business slug from a host when the host is under the configured base domain.
 *
 * @param host - Incoming host header, optionally including a port.
 * @param base - Configured booking base domain, optionally including a port.
 * @returns The subdomain slug, null for the base host, or null for unrelated hosts.
 */
export function parseSubdomain(host: string, base: string): string | null {
  const cleanHost = stripPort(host);
  const cleanBase = stripPort(base);

  if (!cleanHost || !cleanBase || cleanHost === cleanBase) {
    return null;
  }

  const suffix = `.${cleanBase}`;
  if (!cleanHost.endsWith(suffix)) {
    return null;
  }

  const subdomain = cleanHost.slice(0, -suffix.length);
  if (!subdomain || subdomain.includes(".")) {
    return null;
  }

  return subdomain;
}

/**
 * Checks whether a slug is reserved by the platform and cannot identify a business.
 *
 * @param slug - Candidate business slug.
 * @returns True when the slug is reserved.
 */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

/**
 * Reads the business slug from a request according to the active routing mode.
 *
 * @param req - Incoming request with URL and host header.
 * @param mode - Routing mode from configuration.
 * @returns The requested business slug or null when the request targets the app shell.
 */
export function slugFromRequest(
  req: Request,
  mode: RoutingMode
): string | null {
  if (mode === "subdomain") {
    return parseSubdomain(
      req.headers.get("host") ?? "",
      process.env.BOOKING_BASE_DOMAIN ?? ""
    );
  }

  const url = new URL(req.url);
  const firstSegment = url.pathname.split("/").filter(Boolean)[0];

  if (!firstSegment || isReservedSlug(firstSegment)) {
    return null;
  }

  return firstSegment;
}
