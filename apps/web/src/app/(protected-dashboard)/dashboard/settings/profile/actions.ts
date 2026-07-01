"use server";

import { updateBusinessProfileSchema } from "@radevu/shared";
import type { UpdateBusinessProfileInput } from "@radevu/shared";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getManagedBusinessForUser } from "@/lib/business-access";
import {
  clearLogo,
  clearPhoto,
  updateBusinessProfile
} from "@/lib/business-profile";
import { prisma } from "@/lib/db";
import { deleteUploadByUrl, saveUpload } from "@/lib/uploads";

export type SettingsActionResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: string;
    };

export type UploadActionResult =
  | {
      ok: true;
      url: string;
    }
  | {
      ok: false;
      error: string;
    };

type OwnerBusinessContext = {
  business: {
    id: string;
    slug: string;
  };
  ownerId: string;
};

async function getOwnerBusinessContext(): Promise<OwnerBusinessContext> {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    const error = new Error("User must be signed in.");
    error.name = "UNAUTHENTICATED";
    throw error;
  }

  const managed = await getManagedBusinessForUser(session.user.id);
  const business = managed ? await prisma.business.findUnique({
    where: { id: managed.id },
    select: {
      id: true,
      slug: true
    }
  }) : null;

  if (!business) {
    const error = new Error("Owner has no business.");
    error.name = "NOT_FOUND";
    throw error;
  }

  return {
    business,
    ownerId: session.user.id
  };
}

function fieldToString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeSocialUrl(value: FormDataEntryValue | null): string | undefined {
  return fieldToString(value) ?? undefined;
}

function buildProfilePatch(formData: FormData): UpdateBusinessProfileInput {
  const facebook = normalizeSocialUrl(formData.get("facebook_url"));
  const instagram = normalizeSocialUrl(formData.get("instagram_url"));
  const socialLinks: UpdateBusinessProfileInput["social_links"] = {};

  if (facebook) {
    socialLinks.facebook = facebook;
  }

  if (instagram) {
    socialLinks.instagram = instagram;
  }

  return {
    category: fieldToString(formData.get("category")),
    contact_email: fieldToString(formData.get("contact_email")),
    contact_phone: fieldToString(formData.get("contact_phone")),
    description: fieldToString(formData.get("description")),
    maps_url: fieldToString(formData.get("maps_url")),
    name: fieldToString(formData.get("name")) ?? "",
    social_links: socialLinks
  };
}

function revalidateSettingsPaths(slug: string): void {
  revalidatePath("/");
  revalidatePath(`/${slug}`);
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/settings/profile");
  revalidatePath("/dashboard/settings/hours");
  revalidatePath("/dashboard/settings/services");
  revalidatePath("/dashboard/settings/visibility");
}

function mapProfileError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Δεν μπορέσαμε να αποθηκεύσουμε τις αλλαγές.";
  }

  if (error.name === "INVALID_TYPE") {
    return "Η εικόνα πρέπει να είναι PNG, JPG ή WebP.";
  }

  if (error.name === "FILE_TOO_LARGE") {
    return "Η εικόνα πρέπει να είναι έως 5MB.";
  }

  if (error.name === "UNAUTHENTICATED") {
    return "Συνδέσου ξανά για να συνεχίσεις.";
  }

  if (error.name === "FORBIDDEN" || error.name === "NOT_FOUND") {
    return "Δεν βρήκαμε την επιχείρησή σου.";
  }

  return "Δεν μπορέσαμε να αποθηκεύσουμε τις αλλαγές.";
}

/**
 * Saves the owner-editable public profile fields.
 *
 * @param formData - Profile form fields submitted from the settings screen.
 * @returns A typed action result for the client editor.
 */
export async function saveProfileAction(
  formData: FormData
): Promise<SettingsActionResult> {
  const patch = buildProfilePatch(formData);
  const parsed = updateBusinessProfileSchema.safeParse(patch);

  if (!parsed.success) {
    return {
      ok: false,
      error: "Έλεγξε τα στοιχεία και δοκίμασε ξανά."
    };
  }

  try {
    const context = await getOwnerBusinessContext();
    await updateBusinessProfile(
      context.business.id,
      context.ownerId,
      parsed.data
    );
    revalidateSettingsPaths(context.business.slug);
    return { ok: true };
  } catch (error) {
    console.error("Failed to save profile settings", {
      error,
      fields: Object.fromEntries(formData.entries())
    });
    return {
      ok: false,
      error: mapProfileError(error)
    };
  }
}

async function uploadImageAction(
  formData: FormData,
  kind: "logo" | "photo"
): Promise<UploadActionResult> {
  const uploaded = await saveUploadForCurrentBusiness(formData, kind);
  return uploaded;
}

async function saveUploadForCurrentBusiness(
  formData: FormData,
  kind: "logo" | "photo"
): Promise<UploadActionResult> {
  try {
    const context = await getOwnerBusinessContext();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return {
        ok: false,
        error: "Διάλεξε εικόνα για να συνεχίσεις."
      };
    }

    const saved = await saveUpload({
      businessId: context.business.id,
      file,
      kind
    });

    try {
      const patch: UpdateBusinessProfileInput =
        kind === "logo"
          ? { logo_url: saved.url }
          : { photo_url: saved.url };

      await updateBusinessProfile(context.business.id, context.ownerId, patch);
    } catch (error) {
      await deleteUploadByUrl(saved.url);
      throw error;
    }

    revalidateSettingsPaths(context.business.slug);
    return {
      ok: true,
      url: saved.url
    };
  } catch (error) {
    console.error("Failed to upload profile image", {
      error,
      kind
    });
    return {
      ok: false,
      error: mapProfileError(error)
    };
  }
}

/**
 * Uploads and stores a business logo image.
 *
 * @param formData - Multipart form data containing the logo file.
 * @returns The stored upload URL or a typed error.
 */
export async function uploadLogoAction(
  formData: FormData
): Promise<UploadActionResult> {
  return uploadImageAction(formData, "logo");
}

/**
 * Uploads and stores a business hero photo.
 *
 * @param formData - Multipart form data containing the photo file.
 * @returns The stored upload URL or a typed error.
 */
export async function uploadPhotoAction(
  formData: FormData
): Promise<UploadActionResult> {
  return uploadImageAction(formData, "photo");
}

/**
 * Removes the current business logo.
 *
 * @returns A typed action result for the client editor.
 */
export async function removeLogoAction(): Promise<SettingsActionResult> {
  try {
    const context = await getOwnerBusinessContext();
    await clearLogo(context.business.id, context.ownerId);
    revalidateSettingsPaths(context.business.slug);
    return { ok: true };
  } catch (error) {
    console.error("Failed to remove business logo", { error });
    return {
      ok: false,
      error: mapProfileError(error)
    };
  }
}

/**
 * Removes the current business hero photo.
 *
 * @returns A typed action result for the client editor.
 */
export async function removePhotoAction(): Promise<SettingsActionResult> {
  try {
    const context = await getOwnerBusinessContext();
    await clearPhoto(context.business.id, context.ownerId);
    revalidateSettingsPaths(context.business.slug);
    return { ok: true };
  } catch (error) {
    console.error("Failed to remove business photo", { error });
    return {
      ok: false,
      error: mapProfileError(error)
    };
  }
}
