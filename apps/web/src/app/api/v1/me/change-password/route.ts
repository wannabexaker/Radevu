import { changePasswordSchema } from "@radevu/shared";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getCurrentUser } from "@/lib/current-user";
import {
  CHANGE_PASSWORD_LIMIT,
  CHANGE_PASSWORD_WINDOW_MS,
  changePasswordRateLimitKey
} from "@/lib/security/change-password";
import { checkRateLimit } from "@/lib/security/rate-limit";

type ErrorCode =
  | "INVALID_CREDENTIALS"
  | "RATE_LIMITED"
  | "SERVER_ERROR"
  | "UNAUTHENTICATED"
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

function isInvalidCurrentPassword(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return /invalid password/i.test(error.message);
}

function isInvalidCurrentPasswordMessage(message: string | null): boolean {
  return typeof message === "string" && /invalid password/i.test(message);
}

function setCookieHeaders(headers: Headers): string[] {
  const withGetSetCookie = headers as Headers & {
    getSetCookie?: () => string[];
  };
  const values = withGetSetCookie.getSetCookie?.();

  if (values && values.length > 0) {
    return values;
  }

  const singleHeader = headers.get("set-cookie");
  return singleHeader ? [singleHeader] : [];
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
  const user = await getCurrentUser(request.headers);

  if (!user) {
    return errorResponse(401, "UNAUTHENTICATED", "Χρειάζεται σύνδεση.");
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "VALIDATION_ERROR", "Invalid JSON body");
  }

  const parsed = changePasswordSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(
      400,
      "VALIDATION_ERROR",
      "Invalid password input",
      parsed.error.issues.map((issue) => ({
        message: issue.message,
        path: issue.path
      }))
    );
  }

  const rateLimit = await checkRateLimit({
    key: changePasswordRateLimitKey(user.id),
    limit: CHANGE_PASSWORD_LIMIT,
    windowMs: CHANGE_PASSWORD_WINDOW_MS
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
    const changePasswordResponse = await auth.api.changePassword({
      asResponse: true,
      body: {
        currentPassword: parsed.data.current_password,
        newPassword: parsed.data.new_password,
        revokeOtherSessions: true
      },
      headers: request.headers
    });

    if (!changePasswordResponse.ok) {
      const message = await readBetterAuthMessage(changePasswordResponse);

      if (isInvalidCurrentPasswordMessage(message)) {
        return errorResponse(
          400,
          "INVALID_CREDENTIALS",
          "Ο τρέχων κωδικός δεν είναι σωστός."
        );
      }

      return errorResponse(
        500,
        "SERVER_ERROR",
        "Δεν μπορέσαμε να αλλάξουμε τον κωδικό."
      );
    }

    const response = NextResponse.json({ ok: true as const });

    for (const cookie of setCookieHeaders(changePasswordResponse.headers)) {
      response.headers.append("set-cookie", cookie);
    }

    return response;
  } catch (error) {
    if (isInvalidCurrentPassword(error)) {
      return errorResponse(
        400,
        "INVALID_CREDENTIALS",
        "Ο τρέχων κωδικός δεν είναι σωστός."
      );
    }

    console.error("Failed to change password", {
      error,
      userId: user.id
    });

    return errorResponse(
      500,
      "SERVER_ERROR",
      "Δεν μπορέσαμε να αλλάξουμε τον κωδικό."
    );
  }
}
