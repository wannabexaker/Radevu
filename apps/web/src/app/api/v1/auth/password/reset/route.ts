import { resetPasswordSchema } from "@radevu/shared";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getAuthSecurityClientIp } from "@/lib/auth-security";
import { checkRateLimit } from "@/lib/security/rate-limit";

type ErrorCode =
  | "INVALID_TOKEN"
  | "RATE_LIMITED"
  | "SERVER_ERROR"
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

async function readBetterAuthMessage(response: Response): Promise<string | null> {
  const body = (await response.json().catch(() => null)) as
    | { message?: unknown }
    | null;

  return typeof body?.message === "string" ? body.message : null;
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

  const parsed = resetPasswordSchema.safeParse(body);

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

  const ip = getAuthSecurityClientIp(request);
  const rateLimit = await checkRateLimit({
    key: `password-reset-token|${ip}`,
    limit: 10,
    windowMs: 15 * 60_000
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
    const response = await auth.api.resetPassword({
      asResponse: true,
      body: {
        newPassword: parsed.data.new_password,
        token: parsed.data.token
      },
      headers: request.headers
    });

    if (!response.ok) {
      const message = await readBetterAuthMessage(response);

      if (response.status >= 500) {
        console.error("Password reset failed with server error", {
          message,
          status: response.status
        });
        return errorResponse(
          500,
          "SERVER_ERROR",
          "Δεν μπορέσαμε να αλλάξουμε τον κωδικό."
        );
      }

      return errorResponse(
        400,
        "INVALID_TOKEN",
        "Ο σύνδεσμος αλλαγής κωδικού δεν είναι έγκυρος ή έχει λήξει."
      );
    }

    return NextResponse.json({ ok: true as const });
  } catch (error) {
    if (error instanceof Error && /invalid token/i.test(error.message)) {
      return errorResponse(
        400,
        "INVALID_TOKEN",
        "Ο σύνδεσμος αλλαγής κωδικού δεν είναι έγκυρος ή έχει λήξει."
      );
    }

    console.error("Password reset failed", { error });
    return errorResponse(
      500,
      "SERVER_ERROR",
      "Δεν μπορέσαμε να αλλάξουμε τον κωδικό."
    );
  }
}
