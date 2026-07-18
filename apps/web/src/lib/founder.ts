import { env } from "@/lib/env";

/**
 * Resolves the single email allowed to open founder-only surfaces.
 *
 * Falls back to the contact address rather than defaulting to "anyone", so a
 * deploy that forgets to set FOUNDER_EMAIL locks the page instead of opening
 * it. Returns null when neither is configured, which denies everyone.
 *
 * @returns The founder email in lower case, or null when unconfigured.
 */
export function founderEmail(): string | null {
  const configured =
    env.FOUNDER_EMAIL?.trim() || env.CONTACT_NOTIFICATION_EMAIL?.trim();
  return configured ? configured.toLowerCase() : null;
}

/**
 * Checks whether an email belongs to the founder.
 *
 * @param email - Email of the signed-in user, if any.
 * @returns Whether that user may see founder-only data.
 */
export function isFounderEmail(email: string | null | undefined): boolean {
  const allowed = founderEmail();
  return Boolean(allowed && email && email.trim().toLowerCase() === allowed);
}
