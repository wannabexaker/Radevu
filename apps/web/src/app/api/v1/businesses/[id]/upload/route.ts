import { headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type { UpdateBusinessProfileInput } from "@radevu/shared";
import { auth } from "@/lib/auth";
import { canManageBusiness } from "@/lib/business-access";
import { updateBusinessProfile } from "@/lib/business-profile";
import { prisma } from "@/lib/db";
import { deleteUploadByUrl, saveUpload, type UploadKind } from "@/lib/uploads";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INVALID_TYPE"
  | "FILE_TOO_LARGE"
  | "SERVER_ERROR";

type ErrorResponse = {
  error: {
    code: ErrorCode;
    message: string;
  };
};

type UploadResponse = {
  url: string;
};

function errorResponse(
  status: number,
  code: ErrorCode,
  message: string
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      error: {
        code,
        message
      }
    },
    { status }
  );
}

function isUploadKind(value: FormDataEntryValue | null): value is UploadKind {
  return value === "logo" || value === "photo";
}

function isFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File;
}

/**
 * Uploads and stores one owner-owned business image.
 *
 * @param request - Multipart request containing kind and file.
 * @param context - Route context containing business id.
 * @returns Public upload URL or a typed error response.
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<UploadResponse | ErrorResponse>> {
  const { id: businessId } = await context.params;

  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return errorResponse(401, "UNAUTHENTICATED", "Χρειάζεται σύνδεση.");
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
      return errorResponse(404, "NOT_FOUND", "Η επιχείρηση δεν βρέθηκε.");
    }

    if (!(await canManageBusiness(session.user.id, businessId))) {
      return errorResponse(
        403,
        "FORBIDDEN",
        "Δεν έχεις πρόσβαση σε αυτή την επιχείρηση."
      );
    }

    const formData = await request.formData();
    const kind = formData.get("kind");
    const file = formData.get("file");

    if (!isUploadKind(kind) || !isFile(file)) {
      return errorResponse(
        400,
        "INVALID_TYPE",
        "Διάλεξε εικόνα PNG, JPEG ή WebP."
      );
    }

    const saved = await saveUpload({
      businessId,
      file,
      kind
    });

    try {
      const patch: UpdateBusinessProfileInput =
        kind === "logo"
          ? { logo_url: saved.url }
          : { photo_url: saved.url };

      await updateBusinessProfile(businessId, session.user.id, patch);
    } catch (error) {
      await deleteUploadByUrl(saved.url);
      throw error;
    }

    return NextResponse.json(
      {
        url: saved.url
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === "INVALID_TYPE") {
      return errorResponse(
        400,
        "INVALID_TYPE",
        "Διάλεξε εικόνα PNG, JPEG ή WebP."
      );
    }

    if (error instanceof Error && error.name === "FILE_TOO_LARGE") {
      return errorResponse(
        413,
        "FILE_TOO_LARGE",
        "Η εικόνα πρέπει να είναι έως 5MB."
      );
    }

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

    console.error("Failed to upload business image", {
      businessId,
      error
    });
    return errorResponse(
      500,
      "SERVER_ERROR",
      "Δεν μπορέσαμε να ανεβάσουμε την εικόνα."
    );
  }
}
