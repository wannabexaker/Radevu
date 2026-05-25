import type { Business, Prisma } from "@radevu/db";
import type { UpdateBusinessProfileInput } from "@radevu/shared";
import { prisma } from "@/lib/db";
import { deleteUploadByUrl } from "@/lib/uploads";

type BusinessProfilePatch = UpdateBusinessProfileInput;

function toBusinessUpdateData(
  patch: BusinessProfilePatch
): Prisma.BusinessUpdateInput {
  return {
    ...(patch.name !== undefined ? { name: patch.name } : {}),
    ...(patch.contact_email !== undefined
      ? { contactEmail: patch.contact_email }
      : {}),
    ...(patch.contact_phone !== undefined
      ? { contactPhone: patch.contact_phone }
      : {}),
    ...(patch.logo_url !== undefined ? { logoUrl: patch.logo_url } : {}),
    ...(patch.photo_url !== undefined ? { photoUrl: patch.photo_url } : {}),
    ...(patch.maps_url !== undefined ? { mapsUrl: patch.maps_url } : {}),
    ...(patch.social_links !== undefined
      ? { socialLinks: patch.social_links }
      : {}),
    ...(patch.working_hours !== undefined
      ? { workingHours: patch.working_hours }
      : {})
  };
}

async function ownedBusinessOrThrow(
  businessId: string,
  ownerId: string
): Promise<Business> {
  const business = await prisma.business.findUnique({
    where: {
      id: businessId
    }
  });

  if (!business) {
    const error = new Error("Business not found");
    error.name = "NOT_FOUND";
    throw error;
  }

  if (business.ownerId !== ownerId) {
    const error = new Error("Business owner mismatch");
    error.name = "FORBIDDEN";
    throw error;
  }

  return business;
}

/**
 * Updates editable business profile fields after validating owner scope.
 *
 * @param businessId - Business id being edited.
 * @param ownerId - Current better-auth user id.
 * @param patch - Validated profile patch using snake_case API keys.
 * @returns Updated Prisma Business row.
 * @throws Error named NOT_FOUND or FORBIDDEN when ownership fails.
 */
export async function updateBusinessProfile(
  businessId: string,
  ownerId: string,
  patch: BusinessProfilePatch
): Promise<Business> {
  const business = await ownedBusinessOrThrow(businessId, ownerId);
  const updated = await prisma.business.update({
    where: {
      id: businessId
    },
    data: toBusinessUpdateData(patch)
  });

  if (patch.logo_url !== undefined && patch.logo_url !== business.logoUrl) {
    await deleteUploadByUrl(business.logoUrl);
  }

  if (patch.photo_url !== undefined && patch.photo_url !== business.photoUrl) {
    await deleteUploadByUrl(business.photoUrl);
  }

  return updated;
}

/**
 * Clears the business logo and removes the previous uploaded file.
 *
 * @param businessId - Business id being edited.
 * @param ownerId - Current better-auth user id.
 * @returns Resolves after database update and best-effort file deletion.
 * @throws Error named NOT_FOUND or FORBIDDEN when ownership fails.
 */
export async function clearLogo(
  businessId: string,
  ownerId: string
): Promise<void> {
  await updateBusinessProfile(businessId, ownerId, {
    logo_url: null
  });
}

/**
 * Clears the business photo and removes the previous uploaded file.
 *
 * @param businessId - Business id being edited.
 * @param ownerId - Current better-auth user id.
 * @returns Resolves after database update and best-effort file deletion.
 * @throws Error named NOT_FOUND or FORBIDDEN when ownership fails.
 */
export async function clearPhoto(
  businessId: string,
  ownerId: string
): Promise<void> {
  await updateBusinessProfile(businessId, ownerId, {
    photo_url: null
  });
}
