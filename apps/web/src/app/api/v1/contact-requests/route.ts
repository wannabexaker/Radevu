import { sendContactRequestEmail } from "@radevu/email";
import {
  contactRequestSchema,
  type ContactRequestInput
} from "@radevu/shared";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

type ErrorCode = "VALIDATION_ERROR" | "SERVER_ERROR";

type ErrorResponse = {
  error: {
    code: ErrorCode;
    details?: unknown;
    message: string;
  };
};

type ContactNotificationConfig = {
  resendApiKey: string;
  resendFromEmail: string;
  to: string;
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

function contactNotificationConfig(): ContactNotificationConfig | null {
  if (
    !env.RESEND_API_KEY ||
    !env.RESEND_FROM_EMAIL ||
    !env.CONTACT_NOTIFICATION_EMAIL
  ) {
    return null;
  }

  return {
    resendApiKey: env.RESEND_API_KEY,
    resendFromEmail: env.RESEND_FROM_EMAIL,
    to: env.CONTACT_NOTIFICATION_EMAIL
  };
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.slice(0, 500);
  }

  return "Unknown contact request notification failure";
}

async function updateNotificationStatus(
  contactRequestId: string,
  data: {
    notificationError?: string | null;
    notificationSent?: boolean;
  }
): Promise<void> {
  try {
    await prisma.contactRequest.update({
      data,
      where: {
        id: contactRequestId
      }
    });
  } catch (error) {
    console.error("Failed to update contact request notification status", {
      contact_request_id: contactRequestId,
      error
    });
  }
}

async function dispatchContactRequestNotification(
  contactRequestId: string,
  input: ContactRequestInput
): Promise<void> {
  const config = contactNotificationConfig();

  if (!config) {
    console.error("Contact request notification skipped: email config missing", {
      contact_request_id: contactRequestId,
      has_contact_notification_email: Boolean(env.CONTACT_NOTIFICATION_EMAIL),
      has_resend_api_key: Boolean(env.RESEND_API_KEY),
      has_resend_from_email: Boolean(env.RESEND_FROM_EMAIL)
    });
    await updateNotificationStatus(contactRequestId, {
      notificationError: "Email config missing",
      notificationSent: false
    });
    return;
  }

  try {
    await sendContactRequestEmail({
      ...config,
      ...input
    });
    await updateNotificationStatus(contactRequestId, {
      notificationError: null,
      notificationSent: true
    });
  } catch (error) {
    console.error("Failed to send contact request notification", {
      contact_request_id: contactRequestId,
      email: input.email,
      error
    });
    await updateNotificationStatus(contactRequestId, {
      notificationError: errorMessage(error),
      notificationSent: false
    });
  }
}

/**
 * Accepts landing contact requests, stores the lead, and sends a best-effort founder notification.
 *
 * @param request - Incoming contact request with JSON keys.
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
    const contactRequest = await prisma.contactRequest.create({
      data: parsed.data
    });

    void dispatchContactRequestNotification(contactRequest.id, parsed.data);

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Failed to store contact request", {
      email: parsed.data.email,
      error
    });
    return errorResponse(
      500,
      "SERVER_ERROR",
      "Δεν μπορέσαμε να αποθηκεύσουμε το μήνυμα. Δοκίμασε ξανά."
    );
  }
}
