import type { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { validateHoneypot } from "@/lib/security/honeypot";
import { verifyTurnstileToken } from "@/lib/security/turnstile";

export type AuthSecurityInput = {
  email: string;
  formStartedAt: number;
  honeypot: string;
  purpose: "password-reset" | "register" | "verify-resend";
  request: NextRequest;
  turnstileToken: string;
};

export type AuthSecurityResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      code: "RATE_LIMITED" | "SPAM_CHECK_FAILED" | "TURNSTILE_FAILED";
      message: string;
      status: number;
    };

export function getAuthSecurityClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

function shouldVerifyTurnstile(): boolean {
  return (
    env.NODE_ENV === "production" ||
    Boolean(process.env.TURNSTILE_SECRET_KEY?.trim())
  );
}

export async function validateAuthSecurity(
  input: AuthSecurityInput
): Promise<AuthSecurityResult> {
  const honeypot = validateHoneypot({
    formStartedAt: input.formStartedAt,
    trapValue: input.honeypot
  });

  if (!honeypot.ok) {
    return {
      ok: false,
      code: "SPAM_CHECK_FAILED",
      message: "Το αίτημα δεν έγινε δεκτό.",
      status: 400
    };
  }

  if (shouldVerifyTurnstile()) {
    const turnstile = await verifyTurnstileToken({
      remoteIp: getAuthSecurityClientIp(input.request),
      token: input.turnstileToken
    });

    if (!turnstile.ok) {
      return {
        ok: false,
        code: "TURNSTILE_FAILED",
        message: "Δεν μπορέσαμε να επιβεβαιώσουμε ότι είσαι άνθρωπος.",
        status: 400
      };
    }
  } else {
    console.info("Turnstile skipped in development", {
      purpose: input.purpose
    });
  }

  try {
    const limit = await checkRateLimit({
      key: `${input.purpose}|${input.email}|${getAuthSecurityClientIp(input.request)}`,
      limit: input.purpose === "register" ? 5 : 3,
      windowMs: 15 * 60_000
    });

    if (!limit.allowed) {
      return {
        ok: false,
        code: "RATE_LIMITED",
        message: "Προσπάθησε ξανά σε λίγα λεπτά.",
        status: 429
      };
    }
  } catch (error) {
    if (env.NODE_ENV === "production") {
      throw error;
    }

    console.info("Auth rate-limit skipped in development", {
      error,
      purpose: input.purpose
    });
  }

  return {
    ok: true
  };
}
