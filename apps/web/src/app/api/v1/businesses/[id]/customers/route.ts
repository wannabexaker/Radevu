import {
  listCustomersQuerySchema,
  type ListCustomersResponse
} from "@radevu/shared";
import { NextResponse, type NextRequest } from "next/server";
import {
  listCustomers,
  requireCustomerOwnerScope,
  serializeCustomerSummary
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

/**
 * Lists customers for an owner-owned business.
 *
 * @param request - Incoming owner request with customer list filters.
 * @param context - Route context containing the business id.
 * @returns Paginated customer summaries or a typed error response.
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ListCustomersResponse | ErrorResponse>> {
  const { id: businessId } = await context.params;
  const parsedQuery = listCustomersQuerySchema.safeParse({
    search: request.nextUrl.searchParams.get("search") ?? undefined,
    cursor: request.nextUrl.searchParams.get("cursor") ?? undefined,
    take: request.nextUrl.searchParams.get("take") ?? undefined
  });

  if (!parsedQuery.success) {
    return errorResponse(
      400,
      "VALIDATION_ERROR",
      "Τα φίλτρα δεν είναι σωστά.",
      validationDetails(parsedQuery.error.issues)
    );
  }

  try {
    const scope = await requireCustomerOwnerScope({ businessId });

    if (!scope.ok) {
      return errorResponse(
        scope.code === "UNAUTHENTICATED" ? 401 : 403,
        scope.code,
        scope.code === "UNAUTHENTICATED"
          ? "Χρειάζεται σύνδεση."
          : "Δεν έχεις πρόσβαση σε αυτή την επιχείρηση."
      );
    }

    const result = await listCustomers(scope.business.id, {
      cursor: parsedQuery.data.cursor,
      search: parsedQuery.data.search,
      take: parsedQuery.data.take
    });

    return NextResponse.json({
      customers: result.items.map(serializeCustomerSummary),
      next_cursor: result.nextCursor
    });
  } catch (error) {
    console.error("Failed to list owner customers", {
      businessId,
      query: Object.fromEntries(request.nextUrl.searchParams.entries()),
      error
    });
    return errorResponse(
      500,
      "SERVER_ERROR",
      "Δεν μπορέσαμε να φορτώσουμε τους πελάτες."
    );
  }
}
