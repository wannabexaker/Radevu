import {
  registerBusinessSchema,
  RESERVED_DEMO_SLUGS,
  RESERVED_SLUGS
} from "@radevu/shared";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type ErrorCode =
  | "VALIDATION_ERROR"
  | "SLUG_RESERVED"
  | "SLUG_TAKEN"
  | "EMAIL_TAKEN"
  | "AUTH_ERROR"
  | "REGISTRATION_FAILED";

type ErrorResponse = {
  error: {
    code: ErrorCode;
    message?: string;
    details?: unknown;
  };
};

function errorResponse(
  status: number,
  code: ErrorCode,
  message?: string,
  details?: unknown
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      error: {
        code,
        ...(message ? { message } : {}),
        ...(details ? { details } : {})
      }
    },
    { status }
  );
}

async function rollbackUser(userId: string): Promise<void> {
  try {
    await prisma.user.delete({
      where: {
        id: userId
      }
    });
  } catch (error) {
    console.error("Failed to roll back user after business registration error", {
      userId,
      error
    });
  }
}

function setCookieHeaders(headers: Headers): string[] {
  const withGetSetCookie = headers as Headers & {
    getSetCookie?: () => string[];
  };
  const values = withGetSetCookie.getSetCookie?.();

  if (values && values.length > 0) {
    return values;
  }

  const singleHeader = headers.get("set-cookie");
  return singleHeader ? [singleHeader] : [];
}

function rawSlug(body: unknown): string | null {
  if (!body || typeof body !== "object" || !("slug" in body)) {
    return null;
  }

  const slug = (body as { slug?: unknown }).slug;
  return typeof slug === "string" ? slug : null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;

  try {
    body = await req.json();
  } catch (error) {
    console.error("Business registration received invalid JSON", error);
    return errorResponse(400, "VALIDATION_ERROR", "Invalid JSON body");
  }

  const slug = rawSlug(body);

  if (slug && (RESERVED_SLUGS.has(slug) || RESERVED_DEMO_SLUGS.has(slug))) {
    return errorResponse(
      400,
      "SLUG_RESERVED",
      "Αυτό το slug είναι δεσμευμένο. Δοκίμασε ένα διαφορετικό."
    );
  }

  const parsed = registerBusinessSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(
      400,
      "VALIDATION_ERROR",
      "Invalid registration input",
      parsed.error.issues.map((issue) => ({
        path: issue.path,
        message: issue.message
      }))
    );
  }

  const input = parsed.data;

  try {
    const existingBusiness = await prisma.business.findUnique({
      where: {
        slug: input.slug
      },
      select: {
        id: true
      }
    });

    if (existingBusiness) {
      return errorResponse(409, "SLUG_TAKEN");
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: input.owner_email
      },
      select: {
        id: true
      }
    });

    if (existingUser) {
      return errorResponse(409, "EMAIL_TAKEN");
    }
  } catch (error) {
    console.error("Business registration pre-check failed", {
      email: input.owner_email,
      slug: input.slug,
      error
    });
    return errorResponse(500, "REGISTRATION_FAILED");
  }

  let createdUserId: string | null = null;

  try {
    const signUpResult = await auth.api.signUpEmail({
      body: {
        email: input.owner_email,
        password: input.owner_password,
        name: input.business_name
      }
    });

    createdUserId = signUpResult.id;
    const ownerId = signUpResult.id;

    const business = await prisma.business.create({
      data: {
        name: input.business_name,
        slug: input.slug,
        ownerId,
        contactEmail: input.owner_email
      },
      select: {
        id: true,
        slug: true,
        name: true,
        ownerId: true,
        createdAt: true
      }
    });

    const signInResponse = await auth.api.signInEmail({
      body: {
        email: input.owner_email,
        password: input.owner_password
      },
      asResponse: true
    });

    if (!signInResponse.ok) {
      console.error("better-auth sign-in failed after business registration", {
        status: signInResponse.status,
        userId: ownerId
      });
      throw new Error("Failed to create session after registration");
    }

    const session = await prisma.session.findFirst({
      where: {
        userId: createdUserId
      },
      orderBy: {
        createdAt: "desc"
      },
      select: {
        token: true,
        expiresAt: true
      }
    });

    if (!session) {
      console.error("No session found after better-auth sign-in", {
        userId: createdUserId
      });
      throw new Error("Session missing after registration");
    }

    const response = NextResponse.json(
      {
        business: {
          id: business.id,
          slug: business.slug,
          name: business.name,
          owner_id: business.ownerId,
          created_at: business.createdAt.toISOString()
        },
        session: {
          token: session.token,
          expires_at: session.expiresAt.toISOString()
        }
      },
      { status: 201 }
    );

    for (const cookie of setCookieHeaders(signInResponse.headers)) {
      response.headers.append("set-cookie", cookie);
    }

    return response;
  } catch (error) {
    if (createdUserId) {
      await rollbackUser(createdUserId);
    }

    console.error("Business registration failed", {
      email: input.owner_email,
      slug: input.slug,
      error
    });

    return errorResponse(500, "REGISTRATION_FAILED");
  }
}
