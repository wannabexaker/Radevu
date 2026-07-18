import {
  LEGAL_VERSIONS,
  type TermsAcceptanceContext,
  type TermsAcceptanceMethod
} from "@radevu/shared";
import { prisma } from "@/lib/db";

export type RecordTermsAcceptanceInput = {
  context: TermsAcceptanceContext;
  email: string | null;
  method: TermsAcceptanceMethod;
  request: Request;
  userId: string | null;
};

/**
 * Extracts the client IP from the proxy headers, capped to the column width.
 *
 * Mirrors the login-attempt audit so both trails agree on what "the client
 * address" means behind the Cloudflare tunnel.
 *
 * @param request - Incoming request.
 * @returns The first forwarded IP, or null when unavailable.
 */
function forwardedIp(request: Request): string | null {
  const value = request.headers.get("x-forwarded-for");
  const first = value?.split(",")[0]?.trim();
  return first ? first.slice(0, 255) : null;
}

/**
 * Extracts the user agent, capped to a sane length.
 *
 * @param request - Incoming request.
 * @returns The user agent string, or null when absent.
 */
function requestUserAgent(request: Request): string | null {
  const value = request.headers.get("user-agent")?.trim();
  return value ? value.slice(0, 1024) : null;
}

/**
 * Persists proof that someone accepted the current Terms and Privacy Policy.
 *
 * Records the document versions shown at that moment, so the exact text can be
 * reconstructed later. Never throws: losing the evidence row must not fail a
 * registration or a booking, but it is logged loudly so we notice.
 *
 * @param input - Who accepted, in which flow, and by what means.
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
        ip: forwardedIp(input.request),
        method: input.method,
        privacyVersion: LEGAL_VERSIONS.privacy,
        termsVersion: LEGAL_VERSIONS.terms,
        userAgent: requestUserAgent(input.request),
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
