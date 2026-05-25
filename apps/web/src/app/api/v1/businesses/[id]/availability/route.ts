import {
  availabilityQuerySchema,
  type AvailabilityErrorCode
} from "@radevu/shared";
import { NextResponse, type NextRequest } from "next/server";
import { generateSlots } from "@/lib/availability";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ErrorCode =
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "SERVER_ERROR"
  | AvailabilityErrorCode;

type ErrorResponse = {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
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

function datePartsInTimeZone(
  date: Date,
  timezone: string
): { day: number; month: number; year: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric"
  }).formatToParts(date);

  const getPart = (type: string): number => {
    const value = parts.find((part) => part.type === type)?.value;
    return value ? Number(value) : 0;
  };

  return {
    year: getPart("year"),
    month: getPart("month"),
    day: getPart("day")
  };
}

function dateISOFromParts(parts: {
  day: number;
  month: number;
  year: number;
}): string {
  return `${parts.year.toString().padStart(4, "0")}-${parts.month
    .toString()
    .padStart(2, "0")}-${parts.day.toString().padStart(2, "0")}`;
}

function addCalendarDaysISO(dateISO: string, days: number): string {
  const [year = 0, month = 1, day = 1] = dateISO.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days, 12));

  return dateISOFromParts({
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate()
  });
}

function todayISO(timezone: string): string {
  return dateISOFromParts(datePartsInTimeZone(new Date(), timezone));
}

function availabilityDateError(
  dateISO: string,
  timezone: string
): { code: AvailabilityErrorCode; message: string } | null {
  const today = todayISO(timezone);

  if (dateISO < today) {
    return {
      code: "PAST_DATE",
      message: "Η ημερομηνία είναι στο παρελθόν."
    };
  }

  if (dateISO > addCalendarDaysISO(today, 90)) {
    return {
      code: "BEYOND_HORIZON",
      message: "Η ημερομηνία είναι εκτός ορίου 90 ημερών."
    };
  }

  return null;
}

/**
 * Returns public availability slots for an active service on a business-local date.
 *
 * @param request - Incoming request with service_id and date query params.
 * @param context - Route context containing the business id.
 * @returns Available slots or a typed error response.
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { id: businessId } = await context.params;
  const parsed = availabilityQuerySchema.safeParse({
    service_id: request.nextUrl.searchParams.get("service_id") ?? undefined,
    date: request.nextUrl.searchParams.get("date") ?? undefined
  });

  if (!parsed.success) {
    return errorResponse(
      400,
      "VALIDATION_ERROR",
      "Τα στοιχεία διαθεσιμότητας δεν είναι σωστά.",
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
        timezone: true,
        workingHours: true
      }
    });

    if (!business) {
      return errorResponse(404, "NOT_FOUND", "Η επιχείρηση δεν βρέθηκε.");
    }

    const dateError = availabilityDateError(parsed.data.date, business.timezone);

    if (dateError) {
      return errorResponse(400, dateError.code, dateError.message);
    }

    const service = await prisma.service.findUnique({
      where: {
        id: parsed.data.service_id
      },
      select: {
        id: true,
        businessId: true,
        durationMinutes: true,
        active: true
      }
    });

    if (!service || service.businessId !== businessId || !service.active) {
      return errorResponse(
        400,
        "VALIDATION_ERROR",
        "Η υπηρεσία δεν είναι διαθέσιμη."
      );
    }

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        businessId,
        status: "scheduled"
      },
      select: {
        startsAt: true,
        endsAt: true
      }
    });

    const maxStartAt = new Date(Date.now() + 90 * 24 * 60 * 60_000);
    const slots = generateSlots(
      business,
      service,
      parsed.data.date,
      existingAppointments
    ).filter((slot) => slot.startsAt.getTime() <= maxStartAt.getTime());

    return NextResponse.json({
      slots: slots.map((slot) => ({
        starts_at: slot.startsAt.toISOString(),
        ends_at: slot.endsAt.toISOString()
      }))
    });
  } catch (error) {
    console.error("Failed to load public availability", {
      businessId,
      query: Object.fromEntries(request.nextUrl.searchParams.entries()),
      error
    });
    return errorResponse(
      500,
      "SERVER_ERROR",
      "Δεν μπορέσαμε να φορτώσουμε τη διαθεσιμότητα."
    );
  }
}
