import {
  createServiceSchema,
  serviceQuerySchema
} from "@radevu/shared";
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
    message: string;
    details?: unknown;
  };
};

type ServiceResponse = {
  id: string;
  business_id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
  currency: string;
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
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

function serializeService(service: {
  id: string;
  businessId: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
  currency: string;
  description: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}): ServiceResponse {
  return {
    id: service.id,
    business_id: service.businessId,
    name: service.name,
    duration_minutes: service.durationMinutes,
    price_cents: service.priceCents,
    currency: service.currency,
    description: service.description,
    active: service.active,
    created_at: service.createdAt.toISOString(),
    updated_at: service.updatedAt.toISOString()
  };
}

async function getSessionUserId(): Promise<string | null> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    return session?.user.id ?? null;
  } catch (error) {
    console.error("Failed to read better-auth session for services route", {
      error
    });
    throw error;
  }
}

async function requireOwner(businessId: string): Promise<
  | {
      ok: true;
      ownerId: string;
    }
  | {
      ok: false;
      response: NextResponse<ErrorResponse>;
    }
> {
  const sessionUserId = await getSessionUserId();

  if (!sessionUserId) {
    return {
      ok: false,
      response: errorResponse(
        401,
        "UNAUTHENTICATED",
        "Authentication is required."
      )
    };
  }

  const business = await prisma.business.findUnique({
    where: {
      id: businessId
    },
    select: {
      ownerId: true
    }
  });

  if (!business) {
    return {
      ok: false,
      response: errorResponse(404, "NOT_FOUND", "Business was not found.")
    };
  }

  if (business.ownerId !== sessionUserId) {
    return {
      ok: false,
      response: errorResponse(
        403,
        "FORBIDDEN",
        "You do not own this business."
      )
    };
  }

  return {
    ok: true,
    ownerId: business.ownerId
  };
}

/**
 * Lists services for a business, exposing inactive services only to the owner.
 *
 * @param req - Incoming request with optional active query filter.
 * @param context - Route context containing the business id.
 * @returns JSON response containing services or a typed error.
 */
export async function GET(
  req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { id: businessId } = await context.params;
  const parsedQuery = serviceQuerySchema.safeParse({
    active: req.nextUrl.searchParams.get("active") ?? undefined
  });

  if (!parsedQuery.success) {
    return errorResponse(
      400,
      "VALIDATION_ERROR",
      "Invalid services query.",
      validationDetails(parsedQuery.error.issues)
    );
  }

  try {
    const business = await prisma.business.findUnique({
      where: {
        id: businessId
      },
      select: {
        ownerId: true
      }
    });

    if (!business) {
      return errorResponse(404, "NOT_FOUND", "Business was not found.");
    }

    const sessionUserId = await getSessionUserId();
    const isOwner = sessionUserId === business.ownerId;
    const activeFilter = isOwner ? parsedQuery.data.active : true;

    const services = await prisma.service.findMany({
      where: {
        businessId,
        ...(activeFilter === undefined ? {} : { active: activeFilter })
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    return NextResponse.json({
      services: services.map(serializeService)
    });
  } catch (error) {
    console.error("Failed to list services", {
      businessId,
      error
    });
    return errorResponse(500, "SERVER_ERROR", "Failed to list services.");
  }
}

/**
 * Creates a service for a business owned by the current session user.
 *
 * @param req - Incoming request containing the service body.
 * @param context - Route context containing the business id.
 * @returns Created service response or a typed error.
 */
export async function POST(
  req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { id: businessId } = await context.params;

  try {
    const owner = await requireOwner(businessId);

    if (!owner.ok) {
      return owner.response;
    }

    let body: unknown;

    try {
      body = await req.json();
    } catch (error) {
      console.error("Create service received invalid JSON", {
        businessId,
        error
      });
      return errorResponse(400, "VALIDATION_ERROR", "Invalid JSON body.");
    }

    const parsed = createServiceSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        400,
        "VALIDATION_ERROR",
        "Invalid service input.",
        validationDetails(parsed.error.issues)
      );
    }

    const service = await prisma.service.create({
      data: {
        businessId,
        name: parsed.data.name,
        durationMinutes: parsed.data.duration_minutes,
        priceCents: parsed.data.price_cents,
        description: parsed.data.description
      }
    });

    return NextResponse.json(
      {
        service: serializeService(service)
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create service", {
      businessId,
      error
    });
    return errorResponse(500, "SERVER_ERROR", "Failed to create service.");
  }
}
