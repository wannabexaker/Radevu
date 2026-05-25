import {
  monthAvailabilityQuerySchema,
  type AvailabilityErrorCode,
  type MonthAvailabilityDTO
} from "@radevu/shared";
import { NextResponse, type NextRequest } from "next/server";
import { getMonthAvailability } from "@/lib/month-availability";
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
        ...(details === undefined ? {} : { details }),
        message
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

function monthIndex(year: number, month: number): number {
  return year * 12 + month - 1;
}

function monthPartsInTimeZone(
  date: Date,
  timezone: string
): { month: number; year: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
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
    month: getPart("month")
  };
}

function monthAvailabilityError(
  year: number,
  month: number,
  timezone: string
): { code: AvailabilityErrorCode; message: string } | null {
  const now = new Date();
  const current = monthPartsInTimeZone(now, timezone);
  const horizon = monthPartsInTimeZone(
    new Date(now.getTime() + 90 * 24 * 60 * 60_000),
    timezone
  );
  const requestedIndex = monthIndex(year, month);

  if (requestedIndex < monthIndex(current.year, current.month)) {
    return {
      code: "PAST_MONTH",
      message: "Ο μήνας είναι στο παρελθόν."
    };
  }

  if (requestedIndex > monthIndex(horizon.year, horizon.month)) {
    return {
      code: "BEYOND_HORIZON",
      message: "Ο μήνας είναι εκτός ορίου 90 ημερών."
    };
  }

  return null;
}

/**
 * Returns public month availability density for an active service.
 *
 * @param request - Incoming request with service_id, year, and month query params.
 * @param context - Route context containing the business id.
 * @returns Month availability density or a typed error response.
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<MonthAvailabilityDTO | ErrorResponse>> {
  const { id: businessId } = await context.params;
  const parsed = monthAvailabilityQuerySchema.safeParse({
    service_id: request.nextUrl.searchParams.get("service_id") ?? undefined,
    year: request.nextUrl.searchParams.get("year") ?? undefined,
    month: request.nextUrl.searchParams.get("month") ?? undefined
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

    const monthError = monthAvailabilityError(
      parsed.data.year,
      parsed.data.month,
      business.timezone
    );

    if (monthError) {
      return errorResponse(400, monthError.code, monthError.message);
    }

    const service = await prisma.service.findUnique({
      where: {
        id: parsed.data.service_id
      },
      select: {
        active: true,
        businessId: true,
        durationMinutes: true,
        id: true
      }
    });

    if (!service || service.businessId !== businessId || !service.active) {
      return errorResponse(
        400,
        "VALIDATION_ERROR",
        "Η υπηρεσία δεν είναι διαθέσιμη."
      );
    }

    return NextResponse.json(
      await getMonthAvailability(
        business,
        service,
        parsed.data.year,
        parsed.data.month
      )
    );
  } catch (error) {
    console.error("Failed to load public month availability", {
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
