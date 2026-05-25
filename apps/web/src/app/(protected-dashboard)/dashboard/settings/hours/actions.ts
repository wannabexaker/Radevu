"use server";

import { workingHoursSchema } from "@radevu/shared";
import type { WorkingHoursInput } from "@radevu/shared";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { updateBusinessProfile } from "@/lib/business-profile";
import { prisma } from "@/lib/db";

export type HoursActionResult =
  | {
      ok: true;
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

  const business = await prisma.business.findUnique({
    where: {
      ownerId: session.user.id
    },
    select: {
      id: true,
      slug: true
    }
  });

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

function revalidateSettingsPaths(businessId: string, slug: string): void {
  revalidatePath("/");
  revalidatePath(`/${slug}`);
  revalidatePath(`/api/v1/businesses/${businessId}/availability/month`);
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/settings/hours");
  revalidatePath("/dashboard/settings/profile");
  revalidatePath("/dashboard/settings/services");
  revalidatePath("/dashboard/settings/visibility");
}

function mapHoursError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Δεν μπορέσαμε να αποθηκεύσουμε το ωράριο.";
  }

  if (error.name === "UNAUTHENTICATED") {
    return "Συνδέσου ξανά για να συνεχίσεις.";
  }

  if (error.name === "FORBIDDEN" || error.name === "NOT_FOUND") {
    return "Δεν βρήκαμε την επιχείρησή σου.";
  }

  return "Δεν μπορέσαμε να αποθηκεύσουμε το ωράριο.";
}

/**
 * Saves the owner-editable weekly working hours.
 *
 * @param workingHours - Complete weekly working-hours object from the editor.
 * @returns A typed action result for the client editor.
 */
export async function saveHoursAction(
  workingHours: WorkingHoursInput
): Promise<HoursActionResult> {
  const parsed = workingHoursSchema.safeParse(workingHours);

  if (!parsed.success) {
    return {
      ok: false,
      error: "Έλεγξε τις ώρες και δοκίμασε ξανά."
    };
  }

  try {
    const context = await getOwnerBusinessContext();
    await updateBusinessProfile(context.business.id, context.ownerId, {
      working_hours: parsed.data
    });
    revalidateSettingsPaths(context.business.id, context.business.slug);
    return { ok: true };
  } catch (error) {
    console.error("Failed to save business working hours", {
      error,
      workingHours
    });
    return {
      ok: false,
      error: mapHoursError(error)
    };
  }
}
