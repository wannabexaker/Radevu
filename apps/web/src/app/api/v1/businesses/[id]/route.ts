import {
  updateBusinessProfileSchema,
  type UpdateBusinessProfileInput
} from "@radevu/shared";
import { headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { updateBusinessProfile } from "@/lib/business-profile";
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

function serializeBusiness(business: {
  contactEmail: string | null;
  contactPhone: string | null;
  createdAt: Date;
  id: string;
  logoUrl: string | null;
  mapsUrl: string | null;
  name: string;
  ownerId: string;
  photoUrl: string | null;
  showOnLanding: boolean;
  slug: string;
  socialLinks: unknown;
  timezone: string;
  updatedAt: Date;
  workingHours: unknown;
}): {
  business: {
    contact_email: string | null;
    contact_phone: string | null;
    created_at: string;
    id: string;
    logo_url: string | null;
    maps_url: string | null;
    name: string;
    owner_id: string;
    photo_url: string | null;
    show_on_landing: boolean;
    slug: string;
    social_links: unknown;
    timezone: string;
    updated_at: string;
    working_hours: unknown;
  };
} {
  return {
    business: {
      id: business.id,
      slug: business.slug,
      name: business.name,
      contact_email: business.contactEmail,
      contact_phone: business.contactPhone,
      timezone: business.timezone,
      working_hours: business.workingHours,
      logo_url: business.logoUrl,
      photo_url: business.photoUrl,
      social_links: business.socialLinks,
      maps_url: business.mapsUrl,
      show_on_landing: business.showOnLanding,
      owner_id: business.ownerId,
      created_at: business.createdAt.toISOString(),
      updated_at: business.updatedAt.toISOString()
    }
  };
}

/**
 * Returns public business profile fields.
 *
 * @param _request - Incoming business read request.
 * @param context - Route context containing business id.
 * @returns Business profile payload or typed error response.
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { id: businessId } = await context.params;

  try {
    const business = await prisma.business.findUnique({
      where: {
        id: businessId
      }
    });

    if (!business) {
      return errorResponse(404, "NOT_FOUND", "Η επιχείρηση δεν βρέθηκε.");
    }

    return NextResponse.json(serializeBusiness(business));
  } catch (error) {
    console.error("Failed to load business profile API", {
      businessId,
      error
    });
    return errorResponse(
      500,
      "SERVER_ERROR",
      "Δεν μπορέσαμε να φορτώσουμε την επιχείρηση."
    );
  }
}

/**
 * Updates owner-editable business profile fields.
 *
 * @param request - Incoming JSON PATCH request with snake_case profile fields.
 * @param context - Route context containing business id.
 * @returns Updated business payload or typed error response.
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { id: businessId } = await context.params;
  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    console.error("Business profile PATCH received invalid JSON", {
      businessId,
      error
    });
    return errorResponse(
      400,
      "VALIDATION_ERROR",
      "Το αίτημα δεν είναι σωστό."
    );
  }

  const parsed = updateBusinessProfileSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(
      400,
      "VALIDATION_ERROR",
      "Τα στοιχεία δεν είναι σωστά.",
      validationDetails(parsed.error.issues)
    );
  }

  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return errorResponse(
        401,
        "UNAUTHENTICATED",
        "Χρειάζεται σύνδεση."
      );
    }

    const business = await updateBusinessProfile(
      businessId,
      session.user.id,
      parsed.data as UpdateBusinessProfileInput
    );

    return NextResponse.json(serializeBusiness(business));
  } catch (error) {
    if (error instanceof Error && error.name === "NOT_FOUND") {
      return errorResponse(404, "NOT_FOUND", "Η επιχείρηση δεν βρέθηκε.");
    }

    if (error instanceof Error && error.name === "FORBIDDEN") {
      return errorResponse(
        403,
        "FORBIDDEN",
        "Δεν έχεις πρόσβαση σε αυτή την επιχείρηση."
      );
    }

    console.error("Failed to update business profile API", {
      businessId,
      error
    });
    return errorResponse(
      500,
      "SERVER_ERROR",
      "Δεν μπορέσαμε να αποθηκεύσουμε τις αλλαγές."
    );
  }
}
