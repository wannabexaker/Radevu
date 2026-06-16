import { forgotPasswordSchema } from "@radevu/shared";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { validateAuthSecurity } from "@/lib/auth-security";
import { env } from "@/lib/env";

type ErrorCode =
  | "RATE_LIMITED"
  | "SPAM_CHECK_FAILED"
  | "TURNSTILE_FAILED"
  | "VALIDATION_ERROR";

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

function okResponse(): NextResponse<{ ok: true }> {
  return NextResponse.json({ ok: true });
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<{ ok: true } | ErrorResponse>> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "VALIDATION_ERROR", "Invalid JSON body");
  }

  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(
      400,
      "VALIDATION_ERROR",
      "Invalid password reset input",
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
    purpose: "password-reset",
    request,
    turnstileToken: input.turnstile_token
  });

  if (!security.ok) {
    return errorResponse(security.status, security.code, security.message);
  }

  try {
    await auth.api.forgetPassword({
      body: {
        email,
        redirectTo: new URL("/reset-password", env.BETTER_AUTH_URL).toString()
      },
      headers: request.headers
    });
  } catch (error) {
    console.error("Password reset request failed", {
      email,
      error
    });
  }

  return okResponse();
}
