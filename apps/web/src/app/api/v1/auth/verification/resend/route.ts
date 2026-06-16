import { resendVerificationEmailSchema } from "@radevu/shared";
import { NextResponse, type NextRequest } from "next/server";
import { validateAuthSecurity } from "@/lib/auth-security";
import {
  createEmailVerificationToken,
  sendVerificationEmail
} from "@/lib/email-verification";
import { prisma } from "@/lib/db";

type ErrorResponse = {
  error: {
    code:
      | "VALIDATION_ERROR"
      | "RATE_LIMITED"
      | "SPAM_CHECK_FAILED"
      | "TURNSTILE_FAILED"
      | "SERVER_ERROR";
    details?: unknown;
    message: string;
  };
};

function errorResponse(
  status: number,
  code: ErrorResponse["error"]["code"],
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
  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    console.error("Verification resend received invalid JSON", { error });
    return errorResponse(400, "VALIDATION_ERROR", "Invalid JSON body");
  }

  const parsed = resendVerificationEmailSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(
      400,
      "VALIDATION_ERROR",
      "Invalid verification resend input",
      parsed.error.issues.map((issue) => ({
        message: issue.message,
        path: issue.path
      }))
    );
  }

  const input = parsed.data;
  const email = input.email.toLowerCase();
  const security = await validateAuthSecurity({
    email,
    formStartedAt: input.form_started_at,
    honeypot: input.honeypot,
    purpose: "verify-resend",
    request,
    turnstileToken: input.turnstile_token
  });

  if (!security.ok) {
    return errorResponse(security.status, security.code, security.message);
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        email
      },
      select: {
        emailVerified: true,
        id: true,
        name: true
      }
    });

    if (!user || user.emailVerified) {
      return NextResponse.json({ ok: true });
    }

    const token = await createEmailVerificationToken({
      email,
      userId: user.id
    });
    await sendVerificationEmail({
      email,
      name: user.name ?? "Radevu",
      token
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to resend verification email", {
      email,
      error
    });
    return errorResponse(
      500,
      "SERVER_ERROR",
      "Δεν μπορέσαμε να στείλουμε email επιβεβαίωσης."
    );
  }
}
