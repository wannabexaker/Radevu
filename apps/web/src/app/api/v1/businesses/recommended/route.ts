import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import {
  getRecommendedBusinesses,
  type RecommendedBusiness
} from "@/lib/recommendations";

export const dynamic = "force-dynamic";

type RecommendedBusinessDTO = {
  category: string | null;
  description: string | null;
  id: string;
  logo_url: string | null;
  name: string;
  photo_url: string | null;
  slug: string;
};

type ErrorResponse = {
  error: {
    code: "SERVER_ERROR" | "VALIDATION_ERROR";
    message: string;
  };
};

type RecommendedResponse = {
  businesses: RecommendedBusinessDTO[];
  reason: "history" | "random";
};

function serializeBusiness(
  business: RecommendedBusiness
): RecommendedBusinessDTO {
  return {
    category: business.category,
    description: business.description,
    id: business.id,
    logo_url: business.logoUrl,
    name: business.name,
    photo_url: business.photoUrl,
    slug: business.slug
  };
}

function parseLimit(value: string | null): number | undefined {
  if (value === null || value === "") {
    return undefined;
  }

  const numeric = Number(value);
  return Number.isInteger(numeric) ? numeric : Number.NaN;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<RecommendedResponse | ErrorResponse>> {
  const limit = parseLimit(request.nextUrl.searchParams.get("limit"));

  if (Number.isNaN(limit)) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR" as const,
          message: "Το limit δεν είναι σωστό."
        }
      },
      { status: 400 }
    );
  }

  try {
    // Recommendations are public; a session only personalises the order.
    const user = await getCurrentUser(request.headers).catch(() => null);
    const result = await getRecommendedBusinesses({
      limit,
      userId: user?.id ?? null
    });

    return NextResponse.json({
      businesses: result.items.map(serializeBusiness),
      reason: result.reason
    });
  } catch (error) {
    console.error("Failed to build business recommendations", { error });
    return NextResponse.json(
      {
        error: {
          code: "SERVER_ERROR" as const,
          message: "Δεν μπορέσαμε να φορτώσουμε προτάσεις."
        }
      },
      { status: 500 }
    );
  }
}
