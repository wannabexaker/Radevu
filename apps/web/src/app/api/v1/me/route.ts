import { z } from "zod";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { getManagedBusinessForUser } from "@/lib/business-access";
import { prisma } from "@/lib/db";

const updateMeSchema = z.object({
  marketing_opt_in: z.boolean().optional(),
  name: z.string().trim().min(2).max(100).optional(),
  phone: z
    .preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().trim().min(5).max(20).optional()
    )
    .optional()
});

function unauthenticated(): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: "UNAUTHENTICATED",
        message: "Χρειάζεται σύνδεση."
      }
    },
    { status: 401 }
  );
}

function serializeUser(user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) {
  return {
    email: user.email,
    email_verified: user.emailVerified,
    id: user.id,
    marketing_opt_in: user.marketingOptIn,
    name: user.name,
    phone: user.phone,
    user_type: user.userType
  };
}

export async function GET(
  request: NextRequest
): Promise<NextResponse> {
  const user = await getCurrentUser(request.headers);

  if (!user) {
    return unauthenticated();
  }

  const business =
    user.userType === "business_owner"
      ? await getManagedBusinessForUser(user.id)
      : null;

  return NextResponse.json({
    business: business
      ? { id: business.id, name: business.name, slug: business.slug }
      : null,
    user: serializeUser(user)
  });
}

export async function PATCH(
  request: NextRequest
): Promise<NextResponse> {
  const user = await getCurrentUser(request.headers);

  if (!user) {
    return unauthenticated();
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid JSON body"
        }
      },
      { status: 400 }
    );
  }

  const parsed = updateMeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          details: parsed.error.issues.map((issue) => ({
            message: issue.message,
            path: issue.path
          })),
          message: "Invalid profile input"
        }
      },
      { status: 400 }
    );
  }

  const updated = await prisma.user.update({
    data: {
      ...(parsed.data.marketing_opt_in === undefined
        ? {}
        : { marketingOptIn: parsed.data.marketing_opt_in }),
      ...(parsed.data.name === undefined ? {} : { name: parsed.data.name }),
      ...(parsed.data.phone === undefined ? {} : { phone: parsed.data.phone })
    },
    where: {
      id: user.id
    },
    select: {
      email: true,
      emailVerified: true,
      id: true,
      marketingOptIn: true,
      name: true,
      phone: true,
      userType: true
    }
  });

  return NextResponse.json({
    user: serializeUser(updated)
  });
}
