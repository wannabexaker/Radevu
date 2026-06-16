import { registerAuthSchema, RESERVED_DEMO_SLUGS, RESERVED_SLUGS } from "@radevu/shared";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { validateAuthSecurity } from "@/lib/auth-security";
import {
  createEmailVerificationToken,
  sendVerificationEmail
} from "@/lib/email-verification";
import { prisma } from "@/lib/db";

type ErrorCode =
  | "AUTH_ERROR"
  | "EMAIL_TAKEN"
  | "REGISTRATION_FAILED"
  | "SLUG_RESERVED"
  | "SLUG_TAKEN"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "SPAM_CHECK_FAILED"
  | "TURNSTILE_FAILED";

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

async function rollbackUser(userId: string): Promise<void> {
  try {
    await prisma.user.delete({
      where: {
        id: userId
      }
    });
  } catch (error) {
    console.error("Failed to roll back user after auth registration error", {
      error,
      userId
    });
  }
}

async function sendVerificationBestEffort(input: {
  email: string;
  name: string;
  userId: string;
}): Promise<void> {
  try {
    const token = await createEmailVerificationToken({
      email: input.email,
      userId: input.userId
    });
    await sendVerificationEmail({
      email: input.email,
      name: input.name,
      token
    });
  } catch (error) {
    console.error("Failed to send verification email", {
      email: input.email,
      error
    });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    console.error("Auth registration received invalid JSON", { error });
    return errorResponse(400, "VALIDATION_ERROR", "Invalid JSON body");
  }

  const parsed = registerAuthSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(
      400,
      "VALIDATION_ERROR",
      "Invalid registration input",
      parsed.error.issues.map((issue) => ({
        message: issue.message,
        path: issue.path
      }))
    );
  }

  const input = parsed.data;
  const email = input.email.toLowerCase();
  const security = await validateAuthSecurity({
    email,
    formStartedAt: input.form_started_at,
    honeypot: input.honeypot,
    purpose: "register",
    request,
    turnstileToken: input.turnstile_token
  });

  if (!security.ok) {
    return errorResponse(
      security.status,
      security.code,
      security.message
    );
  }

  if (
    input.user_type === "business_owner" &&
    (RESERVED_SLUGS.has(input.slug) || RESERVED_DEMO_SLUGS.has(input.slug))
  ) {
    return errorResponse(
      400,
      "SLUG_RESERVED",
      "Αυτό το slug είναι δεσμευμένο. Δοκίμασε ένα διαφορετικό."
    );
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        email
      },
      select: {
        id: true
      }
    });

    if (existingUser) {
      return errorResponse(
        409,
        "EMAIL_TAKEN",
        "Υπάρχει ήδη λογαριασμός με αυτό το email."
      );
    }

    if (input.user_type === "business_owner") {
      const existingBusiness = await prisma.business.findUnique({
        where: {
          slug: input.slug
        },
        select: {
          id: true
        }
      });

      if (existingBusiness) {
        return errorResponse(
          409,
          "SLUG_TAKEN",
          "Αυτό το slug χρησιμοποιείται ήδη."
        );
      }
    }
  } catch (error) {
    console.error("Auth registration pre-check failed", {
      email,
      error
    });
    return errorResponse(
      500,
      "REGISTRATION_FAILED",
      "Η εγγραφή απέτυχε."
    );
  }

  let createdUserId: string | null = null;

  try {
    const signUpResult = await auth.api.signUpEmail({
      body: {
        email,
        name: input.name,
        password: input.password
      }
    });
    createdUserId = signUpResult.id;

    await prisma.user.update({
      data: {
        marketingOptIn: input.marketing_opt_in,
        name: input.name,
        phone: input.phone ?? null,
        userType: input.user_type
      },
      where: {
        id: createdUserId
      }
    });

    let business:
      | {
          id: string;
          name: string;
          slug: string;
        }
      | null = null;

    if (input.user_type === "business_owner") {
      business = await prisma.business.create({
        data: {
          contactEmail: email,
          contactPhone: input.phone ?? null,
          name: input.business_name,
          ownerId: createdUserId,
          slug: input.slug
        },
        select: {
          id: true,
          name: true,
          slug: true
        }
      });
    }

    const signInResponse = await auth.api.signInEmail({
      asResponse: true,
      body: {
        email,
        password: input.password
      }
    });

    if (!signInResponse.ok) {
      throw new Error("Failed to create session after registration");
    }

    await sendVerificationBestEffort({
      email,
      name: input.name,
      userId: createdUserId
    });

    const response = NextResponse.json(
      {
        business: business
          ? {
              id: business.id,
              name: business.name,
              slug: business.slug
            }
          : null,
        redirect_to:
          input.user_type === "business_owner" ? "/dashboard/today" : "/account",
        user: {
          email,
          id: createdUserId,
          name: input.name,
          user_type: input.user_type
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

    console.error("Auth registration failed", {
      email,
      error,
      user_type: input.user_type
    });
    return errorResponse(
      500,
      "REGISTRATION_FAILED",
      "Η εγγραφή απέτυχε. Δοκίμασε ξανά."
    );
  }
}
