import {
  updateCustomerSchema,
  type GetCustomerResponse,
  type UpdateCustomerResponse
} from "@radevu/shared";
import { NextResponse, type NextRequest } from "next/server";
import {
  getCustomer,
  requireCustomerOwnerScope,
  serializeAppointmentInCustomer,
  serializeCustomerDetail,
  updateCustomer
} from "@/lib/customers";

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

function scopeErrorResponse(
  code: "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND"
): NextResponse<ErrorResponse> {
  if (code === "UNAUTHENTICATED") {
    return errorResponse(401, code, "Χρειάζεται σύνδεση.");
  }

  if (code === "NOT_FOUND") {
    return errorResponse(404, code, "Ο πελάτης δεν βρέθηκε.");
  }

  return errorResponse(403, code, "Δεν έχεις πρόσβαση σε αυτόν τον πελάτη.");
}

/**
 * Loads one owner-owned customer with booking history.
 *
 * @param _request - Incoming request; no query params are used.
 * @param context - Route context containing the customer id.
 * @returns Customer detail with booking history or a typed error response.
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<GetCustomerResponse | ErrorResponse>> {
  const { id: customerId } = await context.params;

  try {
    const scope = await requireCustomerOwnerScope({ customerId });

    if (!scope.ok) {
      return scopeErrorResponse(scope.code);
    }

    const customer = await getCustomer(scope.business.id, customerId);

    if (!customer) {
      return errorResponse(404, "NOT_FOUND", "Ο πελάτης δεν βρέθηκε.");
    }

    return NextResponse.json({
      customer: serializeCustomerDetail(customer),
      appointments: customer.appointments.map(serializeAppointmentInCustomer)
    });
  } catch (error) {
    console.error("Failed to load customer by id", {
      customerId,
      error
    });
    return errorResponse(
      500,
      "SERVER_ERROR",
      "Δεν μπορέσαμε να φορτώσουμε τον πελάτη."
    );
  }
}

/**
 * Updates minimal CRM fields for one owner-owned customer.
 *
 * @param request - Incoming owner request with customer notes fields.
 * @param context - Route context containing the customer id.
 * @returns Updated customer detail or a typed error response.
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<UpdateCustomerResponse | ErrorResponse>> {
  const { id: customerId } = await context.params;

  try {
    const scope = await requireCustomerOwnerScope({ customerId });

    if (!scope.ok) {
      return scopeErrorResponse(scope.code);
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch (error) {
      console.error("Customer update received invalid JSON", {
        customerId,
        error
      });
      return errorResponse(
        400,
        "VALIDATION_ERROR",
        "Το αίτημα δεν είναι σωστό."
      );
    }

    const parsed = updateCustomerSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        400,
        "VALIDATION_ERROR",
        "Τα στοιχεία του πελάτη δεν είναι σωστά.",
        validationDetails(parsed.error.issues)
      );
    }

    await updateCustomer(scope.business.id, customerId, parsed.data);

    const customer = await getCustomer(scope.business.id, customerId);

    if (!customer) {
      return errorResponse(404, "NOT_FOUND", "Ο πελάτης δεν βρέθηκε.");
    }

    return NextResponse.json({
      customer: serializeCustomerDetail(customer)
    });
  } catch (error) {
    console.error("Failed to update customer", {
      customerId,
      error
    });
    return errorResponse(
      500,
      "SERVER_ERROR",
      "Δεν μπορέσαμε να ενημερώσουμε τον πελάτη."
    );
  }
}
