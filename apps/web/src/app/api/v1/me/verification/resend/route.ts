import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import {
  createEmailVerificationToken,
  sendVerificationEmail
} from "@/lib/email-verification";
import { checkRateLimit } from "@/lib/security/rate-limit";
import {
  ME_VERIFICATION_RESEND_LIMIT,
  ME_VERIFICATION_RESEND_WINDOW_MS,
  meVerificationResendRateLimitKey
} from "@/lib/security/me-verification-resend";

type ErrorCode = "RATE_LIMITED" | "SERVER_ERROR" | "UNAUTHENTICATED";

type ErrorResponse = {
  error: {
    code: ErrorCode;
    details?: unknown;
    message: string;
  };
};

function errorResponse(
  status: number,
  code: ErrorCode,
  message: string,
  details?: unknown
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(details === undefined ? {} : { details })
      }
    },
    { status }
  );
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<{ ok: true } | ErrorResponse>> {
  const user = await getCurrentUser(request.headers);

  if (!user) {
    return errorResponse(401, "UNAUTHENTICATED", "Χρειάζεται σύνδεση.");
  }

  if (user.emailVerified) {
    return NextResponse.json({ ok: true });
  }

  const rateLimit = await checkRateLimit({
    key: meVerificationResendRateLimitKey(user.id),
    limit: ME_VERIFICATION_RESEND_LIMIT,
    windowMs: ME_VERIFICATION_RESEND_WINDOW_MS
  });

  if (!rateLimit.allowed) {
    return errorResponse(
      429,
      "RATE_LIMITED",
      "Δοκίμασε ξανά σε λίγα λεπτά.",
      {
        retry_after_ms: rateLimit.retryAfterMs
      }
    );
  }

  try {
    const token = await createEmailVerificationToken({
      email: user.email,
      userId: user.id
    });
    await sendVerificationEmail({
      email: user.email,
      name: user.name ?? "Radevu",
      token
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to resend authenticated verification email", {
      email: user.email,
      error,
      userId: user.id
    });
    return errorResponse(
      500,
      "SERVER_ERROR",
      "Δεν μπορέσαμε να στείλουμε email επιβεβαίωσης."
    );
  }
}
