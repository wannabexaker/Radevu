import { updateVisibilitySchema } from "@radevu/shared";
import { headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { canManageBusiness } from "@/lib/business-access";
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
  | "VISIBILITY_UPDATE_FAILED";

type ErrorResponse = {
  error: {
    code: ErrorCode;
    details?: unknown;
    message: string;
  };
};

type VisibilityResponse = {
  business: {
    id: string;
    show_on_landing: boolean;
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
 * Updates whether an owner business appears on the landing showcase.
 *
 * @param request - Incoming visibility request.
 * @param context - Route params containing the business id.
 * @returns The updated visibility flag or a typed error response.
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<VisibilityResponse | ErrorResponse>> {
  const { id } = await context.params;

  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return errorResponse(
      401,
      "UNAUTHENTICATED",
      "Authentication is required."
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    console.error("Business visibility received invalid JSON", {
      businessId: id,
      error
    });
    return errorResponse(400, "VALIDATION_ERROR", "Invalid JSON body");
  }

  const parsed = updateVisibilitySchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(
      400,
      "VALIDATION_ERROR",
      "Invalid visibility input",
      parsed.error.issues.map((issue) => ({
        path: issue.path,
        message: issue.message
      }))
    );
  }

  try {
    const business = await prisma.business.findUnique({
      where: {
        id
      },
      select: {
        id: true,
        ownerId: true
      }
    });

    if (!business) {
      return errorResponse(404, "NOT_FOUND", "Business not found.");
    }

    if (!(await canManageBusiness(session.user.id, id))) {
      return errorResponse(403, "FORBIDDEN", "Business is not owned by user.");
    }

    const updatedBusiness = await prisma.business.update({
      where: {
        id
      },
      data: {
        showOnLanding: parsed.data.show_on_landing
      },
      select: {
        id: true,
        showOnLanding: true
      }
    });

    return NextResponse.json({
      business: {
        id: updatedBusiness.id,
        show_on_landing: updatedBusiness.showOnLanding
      }
    });
  } catch (error) {
    console.error("Failed to update business landing visibility", {
      businessId: id,
      error
    });
    return errorResponse(
      500,
      "VISIBILITY_UPDATE_FAILED",
      "Visibility update failed."
    );
  }
}
