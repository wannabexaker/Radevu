import {
  updateAppointmentSchema,
  type GetAppointmentResponse
} from "@radevu/shared";
import { type Prisma } from "@radevu/db";
import { headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import {
  InvalidAppointmentTransitionError,
  serializeAppointmentWithRelations,
  updateAppointmentPaid,
  updateAppointmentStatus
} from "@/lib/appointments";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cancelReminder } from "@/lib/reminder-queue";

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
  | "INVALID_TRANSITION"
  | "SERVER_ERROR";

type ErrorResponse = {
  error: {
    code: ErrorCode;
    details?: unknown;
    message: string;
  };
};

const ownedAppointmentInclude = {
  business: {
    select: {
      id: true,
      ownerId: true
    }
  },
  customer: {
    select: {
      email: true,
      id: true,
      name: true,
      phone: true
    }
  },
  service: {
    select: {
      currency: true,
      durationMinutes: true,
      id: true,
      name: true,
      priceCents: true
    }
  },
  messages: {
    orderBy: {
      createdAt: "asc"
    },
    select: {
      authorRole: true,
      body: true,
      createdAt: true,
      id: true
    }
  }
} satisfies Prisma.AppointmentInclude;

type OwnedAppointment = Prisma.AppointmentGetPayload<{
  include: typeof ownedAppointmentInclude;
}>;

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

async function requireOwnerForAppointment(appointmentId: string): Promise<
  | {
      ok: true;
      appointment: OwnedAppointment;
    }
  | {
      ok: false;
      response: NextResponse<ErrorResponse>;
    }
> {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return {
      ok: false,
      response: errorResponse(401, "UNAUTHENTICATED", "Χρειάζεται σύνδεση.")
    };
  }

  const appointment = await prisma.appointment.findUnique({
    include: ownedAppointmentInclude,
    where: {
      id: appointmentId
    }
  });

  if (!appointment) {
    return {
      ok: false,
      response: errorResponse(404, "NOT_FOUND", "Η κράτηση δεν βρέθηκε.")
    };
  }

  if (appointment.business.ownerId !== session.user.id) {
    return {
      ok: false,
      response: errorResponse(403, "FORBIDDEN", "Δεν έχεις πρόσβαση σε αυτή την κράτηση.")
    };
  }

  return {
    ok: true,
    appointment
  };
}

/**
 * Loads one owner-owned appointment by id.
 *
 * @param _request - Incoming request; no query params are used.
 * @param context - Route context containing the appointment id.
 * @returns Appointment with customer and service summary or a typed error response.
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<GetAppointmentResponse | ErrorResponse>> {
  const { id: appointmentId } = await context.params;

  try {
    const ownerCheck = await requireOwnerForAppointment(appointmentId);

    if (!ownerCheck.ok) {
      return ownerCheck.response;
    }

    return NextResponse.json({
      appointment: serializeAppointmentWithRelations(ownerCheck.appointment)
    });
  } catch (error) {
    console.error("Failed to load appointment by id", {
      appointmentId,
      error
    });
    return errorResponse(
      500,
      "SERVER_ERROR",
      "Δεν μπορέσαμε να φορτώσουμε την κράτηση."
    );
  }
}

/**
 * Updates status, paid flag, or notes for one owner-owned appointment.
 *
 * @param request - Incoming owner request with partial appointment fields.
 * @param context - Route context containing the appointment id.
 * @returns Updated appointment with relations or a typed error response.
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<GetAppointmentResponse | ErrorResponse>> {
  const { id: appointmentId } = await context.params;

  try {
    const ownerCheck = await requireOwnerForAppointment(appointmentId);

    if (!ownerCheck.ok) {
      return ownerCheck.response;
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch (error) {
      console.error("Appointment update received invalid JSON", {
        appointmentId,
        error
      });
      return errorResponse(
        400,
        "VALIDATION_ERROR",
        "Το αίτημα δεν είναι σωστό."
      );
    }

    const parsed = updateAppointmentSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        400,
        "VALIDATION_ERROR",
        "Τα στοιχεία της κράτησης δεν είναι σωστά.",
        validationDetails(parsed.error.issues)
      );
    }

    if (parsed.data.status !== undefined) {
      await updateAppointmentStatus(appointmentId, parsed.data.status);

      if (
        parsed.data.status === "cancelled" ||
        parsed.data.status === "done"
      ) {
        try {
          await cancelReminder(appointmentId);
        } catch (error) {
          console.error("Failed to cancel appointment reminder", {
            appointmentId,
            status: parsed.data.status,
            error
          });
        }
      }
    }

    if (parsed.data.paid !== undefined) {
      await updateAppointmentPaid(appointmentId, parsed.data.paid);
    }

    if (parsed.data.notes !== undefined) {
      await prisma.appointment.update({
        data: {
          notes: parsed.data.notes
        },
        where: {
          id: appointmentId
        }
      });
    }

    const updated = await prisma.appointment.findUnique({
      include: ownedAppointmentInclude,
      where: {
        id: appointmentId
      }
    });

    if (!updated) {
      return errorResponse(404, "NOT_FOUND", "Η κράτηση δεν βρέθηκε.");
    }

    return NextResponse.json({
      appointment: serializeAppointmentWithRelations(updated)
    });
  } catch (error) {
    if (error instanceof InvalidAppointmentTransitionError) {
      return errorResponse(
        400,
        "INVALID_TRANSITION",
        "Δεν μπορείς να αλλάξεις έτσι αυτή την κράτηση."
      );
    }

    console.error("Failed to update appointment", {
      appointmentId,
      error
    });
    return errorResponse(
      500,
      "SERVER_ERROR",
      "Δεν μπορέσαμε να ενημερώσουμε την κράτηση."
    );
  }
}
