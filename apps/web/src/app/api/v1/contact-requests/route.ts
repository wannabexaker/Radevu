import { sendContactRequestEmail } from "@radevu/email";
import { contactRequestSchema } from "@radevu/shared";
import { NextResponse, type NextRequest } from "next/server";

type ErrorCode = "VALIDATION_ERROR" | "EMAIL_SEND_FAILED";

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
        ...(details ? { details } : {})
      }
    },
    { status }
  );
}

/**
 * Accepts landing contact requests and sends a founder notification email.
 *
 * @param request - Incoming contact request with snake_case JSON keys.
 * @returns A success payload or a typed error response.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<{ ok: true } | ErrorResponse>> {
  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    console.error("Contact request received invalid JSON", { error });
    return errorResponse(400, "VALIDATION_ERROR", "Invalid JSON body");
  }

  const parsed = contactRequestSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(
      400,
      "VALIDATION_ERROR",
      "Invalid contact request input",
      parsed.error.issues.map((issue) => ({
        path: issue.path,
        message: issue.message
      }))
    );
  }

  try {
    await sendContactRequestEmail(parsed.data);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Failed to send contact request notification", {
      email: parsed.data.email,
      error
    });
    return errorResponse(500, "EMAIL_SEND_FAILED", "Δοκίμασε ξανά.");
  }
}
