import {
  defaultNotificationSettings,
  notificationSettingsSchema,
  updateNotificationSettingsSchema
} from "@radevu/shared";
import type { NotificationSettingsDTO } from "@radevu/shared";
import { headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "SERVER_ERROR";

type ErrorResponse = {
  error: {
    code: ErrorCode;
    details?: unknown;
    message: string;
  };
};

type NotificationSettingsResponse = {
  business: {
    id: string;
    notification_settings: NotificationSettingsDTO;
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

function validationDetails(
  issues: Array<{
    path: Array<string | number>;
    message: string;
  }>
): Array<{ path: Array<string | number>; message: string }> {
  return issues.map((issue) => ({
    path: issue.path,
    message: issue.message
  }));
}

function parseStoredSettings(value: unknown): NotificationSettingsDTO {
  const parsed = notificationSettingsSchema.safeParse(value);
  return parsed.success ? parsed.data : defaultNotificationSettings;
}

/**
 * Updates owner-controlled notification settings for one business.
 *
 * @param request - Incoming owner request with partial notification settings.
 * @param context - Route context containing the business id.
 * @returns Updated notification settings or a typed error response.
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<NotificationSettingsResponse | ErrorResponse>> {
  const { id: businessId } = await context.params;
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return errorResponse(401, "UNAUTHENTICATED", "Χρειάζεται σύνδεση.");
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    console.error("Notification settings PATCH received invalid JSON", {
      businessId,
      error
    });
    return errorResponse(
      400,
      "VALIDATION_ERROR",
      "Το αίτημα δεν είναι σωστό."
    );
  }

  const parsed = updateNotificationSettingsSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(
      400,
      "VALIDATION_ERROR",
      "Οι ρυθμίσεις ειδοποιήσεων δεν είναι σωστές.",
      validationDetails(parsed.error.issues)
    );
  }

  try {
    const business = await prisma.business.findUnique({
      where: {
        id: businessId
      },
      select: {
        id: true,
        notificationSettings: true,
        ownerId: true
      }
    });

    if (!business) {
      return errorResponse(404, "NOT_FOUND", "Η επιχείρηση δεν βρέθηκε.");
    }

    if (business.ownerId !== session.user.id) {
      return errorResponse(
        403,
        "FORBIDDEN",
        "Δεν έχεις πρόσβαση σε αυτή την επιχείρηση."
      );
    }

    const nextSettings = {
      ...parseStoredSettings(business.notificationSettings),
      ...parsed.data
    };
    const updatedBusiness = await prisma.business.update({
      where: {
        id: business.id
      },
      data: {
        notificationSettings: nextSettings
      },
      select: {
        id: true,
        notificationSettings: true
      }
    });

    return NextResponse.json({
      business: {
        id: updatedBusiness.id,
        notification_settings: parseStoredSettings(
          updatedBusiness.notificationSettings
        )
      }
    });
  } catch (error) {
    console.error("Failed to update notification settings", {
      businessId,
      error
    });
    return errorResponse(
      500,
      "SERVER_ERROR",
      "Δεν μπορέσαμε να αποθηκεύσουμε τις ειδοποιήσεις."
    );
  }
}
