import { updateServiceSchema } from "@radevu/shared";
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

async function requireOwner(businessId: string): Promise<
  | {
      ok: true;
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

  if (business.ownerId !== session.user.id) {
    return {
      ok: false,
      response: errorResponse(
        403,
        "FORBIDDEN",
        "You do not own this service."
      )
    };
  }

  return {
    ok: true
  };
}

/**
 * Updates a service owned by the current session user.
 *
 * @param req - Incoming request containing partial service fields.
 * @param context - Route context containing the service id.
 * @returns Updated service response or a typed error.
 */
export async function PATCH(
  req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { id: serviceId } = await context.params;

  try {
    const service = await prisma.service.findUnique({
      where: {
        id: serviceId
      },
      select: {
        businessId: true
      }
    });

    if (!service) {
      return errorResponse(404, "NOT_FOUND", "Service was not found.");
    }

    const owner = await requireOwner(service.businessId);

    if (!owner.ok) {
      return owner.response;
    }

    let body: unknown;

    try {
      body = await req.json();
    } catch (error) {
      console.error("Update service received invalid JSON", {
        serviceId,
        error
      });
      return errorResponse(400, "VALIDATION_ERROR", "Invalid JSON body.");
    }

    const parsed = updateServiceSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        400,
        "VALIDATION_ERROR",
        "Invalid service input.",
        validationDetails(parsed.error.issues)
      );
    }

    const updatedService = await prisma.service.update({
      where: {
        id: serviceId
      },
      data: {
        ...(parsed.data.name === undefined ? {} : { name: parsed.data.name }),
        ...(parsed.data.duration_minutes === undefined
          ? {}
          : { durationMinutes: parsed.data.duration_minutes }),
        ...(parsed.data.price_cents === undefined
          ? {}
          : { priceCents: parsed.data.price_cents }),
        ...(parsed.data.description === undefined
          ? {}
          : { description: parsed.data.description }),
        ...(parsed.data.active === undefined
          ? {}
          : { active: parsed.data.active })
      }
    });

    return NextResponse.json({
      service: serializeService(updatedService)
    });
  } catch (error) {
    console.error("Failed to update service", {
      serviceId,
      error
    });
    return errorResponse(500, "SERVER_ERROR", "Failed to update service.");
  }
}

/**
 * Deletes a service owned by the current session user.
 *
 * @param _req - Incoming request, unused because DELETE has no body.
 * @param context - Route context containing the service id.
 * @returns Empty 204 response or a typed error.
 */
export async function DELETE(
  _req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { id: serviceId } = await context.params;

  try {
    const service = await prisma.service.findUnique({
      where: {
        id: serviceId
      },
      select: {
        businessId: true
      }
    });

    if (!service) {
      return errorResponse(404, "NOT_FOUND", "Service was not found.");
    }

    const owner = await requireOwner(service.businessId);

    if (!owner.ok) {
      return owner.response;
    }

    await prisma.service.delete({
      where: {
        id: serviceId
      }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete service", {
      serviceId,
      error
    });
    return errorResponse(500, "SERVER_ERROR", "Failed to delete service.");
  }
}
