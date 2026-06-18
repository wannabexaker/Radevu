import {
  listBusinessDirectoryQuerySchema,
  type BusinessDirectoryDTO,
  type ListBusinessDirectoryResponse
} from "@radevu/shared";
import { NextResponse, type NextRequest } from "next/server";
import {
  type DirectoryBusiness,
  listDirectoryBusinesses
} from "@/lib/business-directory";

export const dynamic = "force-dynamic";

type ErrorResponse = {
  error: {
    code: "VALIDATION_ERROR" | "SERVER_ERROR";
    details?: unknown;
    message: string;
  };
};

function errorResponse(
  status: number,
  code: ErrorResponse["error"]["code"],
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

function serializeBusiness(business: DirectoryBusiness): BusinessDirectoryDTO {
  return {
    id: business.id,
    slug: business.slug,
    name: business.name,
    category: business.category,
    description: business.description,
    logo_url: business.logoUrl,
    photo_url: business.photoUrl
  };
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ListBusinessDirectoryResponse | ErrorResponse>> {
  const parsedQuery = listBusinessDirectoryQuerySchema.safeParse({
    category: request.nextUrl.searchParams.get("category") ?? undefined,
    cursor: request.nextUrl.searchParams.get("cursor") ?? undefined,
    search: request.nextUrl.searchParams.get("search") ?? undefined,
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
    const result = await listDirectoryBusinesses(parsedQuery.data);

    return NextResponse.json({
      businesses: result.items.map(serializeBusiness),
      next_cursor: result.nextCursor
    });
  } catch (error) {
    console.error("Failed to list directory businesses", { error });
    return errorResponse(
      500,
      "SERVER_ERROR",
      "Δεν μπορέσαμε να φορτώσουμε τους επαγγελματίες."
    );
  }
}
