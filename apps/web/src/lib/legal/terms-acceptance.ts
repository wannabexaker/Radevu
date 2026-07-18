import {
  LEGAL_VERSIONS,
  type TermsAcceptanceContext,
  type TermsAcceptanceMethod
} from "@radevu/shared";
import { prisma } from "@/lib/db";
import type { ClientMeta } from "@/lib/request-meta";

export type RecordTermsAcceptanceInput = {
  context: TermsAcceptanceContext;
  email: string | null;
  meta: ClientMeta;
  method: TermsAcceptanceMethod;
  userId: string | null;
};

/**
 * Persists proof that someone accepted the current Terms and Privacy Policy.
 *
 * Records the document versions shown at that moment, so the exact text can be
 * reconstructed later. Never throws: losing the evidence row must not fail a
 * registration or a booking, but it is logged loudly so we notice.
 *
 * @param input - Who accepted, in which flow, by what means, and from where.
 * @returns Nothing; failures are swallowed after logging.
 */
export async function recordTermsAcceptance(
  input: RecordTermsAcceptanceInput
): Promise<void> {
  try {
    await prisma.termsAcceptance.create({
      data: {
        context: input.context,
        email: input.email,
        ip: input.meta.ip,
        method: input.method,
        privacyVersion: LEGAL_VERSIONS.privacy,
        termsVersion: LEGAL_VERSIONS.terms,
        userAgent: input.meta.userAgent,
        userId: input.userId
      }
    });

    if (input.userId) {
      await prisma.user.update({
        data: {
          privacyVersion: LEGAL_VERSIONS.privacy,
          termsAcceptedAt: new Date(),
          termsVersion: LEGAL_VERSIONS.terms
        },
        where: {
          id: input.userId
        }
      });
    }
  } catch (error) {
    console.error("Failed to persist terms acceptance", {
      context: input.context,
      error: error instanceof Error ? error.message : "unknown_error",
      userId: input.userId
    });
  }
}

/**
 * Decides whether a signed-in user still owes an acceptance.
 *
 * True for accounts created before terms acceptance was captured at all, and
 * for accounts that accepted an older version of either document.
 *
 * @param user - The stored acceptance state for the current user.
 * @returns Whether the user should be asked to accept the current documents.
 */
export function needsTermsAcceptance(user: {
  privacyVersion: string | null;
  termsVersion: string | null;
}): boolean {
  return (
    user.termsVersion !== LEGAL_VERSIONS.terms ||
    user.privacyVersion !== LEGAL_VERSIONS.privacy
  );
}
