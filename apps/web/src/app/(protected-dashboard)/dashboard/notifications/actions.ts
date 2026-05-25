"use server";

import {
  defaultNotificationSettings,
  notificationSettingsSchema,
  updateNotificationSettingsSchema
} from "@radevu/shared";
import type {
  NotificationSettingsDTO,
  ReminderLeadMinutes
} from "@radevu/shared";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type NotificationSettingsActionResult =
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
    notificationSettings: unknown;
  };
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
      notificationSettings: true
    }
  });

  if (!business) {
    const error = new Error("Owner has no business.");
    error.name = "NOT_FOUND";
    throw error;
  }

  return {
    business
  };
}

function parseStoredSettings(value: unknown): NotificationSettingsDTO {
  const parsed = notificationSettingsSchema.safeParse(value);
  return parsed.success ? parsed.data : defaultNotificationSettings;
}

function parseBoolean(value: FormDataEntryValue | null): boolean {
  return value === "true";
}

function parseLeadMinutes(value: FormDataEntryValue | null): ReminderLeadMinutes {
  const numericValue = typeof value === "string" ? Number(value) : 1440;

  if (numericValue === 720 || numericValue === 1440 || numericValue === 2880) {
    return numericValue;
  }

  return 1440;
}

function mapNotificationError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Δεν μπορέσαμε να αποθηκεύσουμε τις ειδοποιήσεις.";
  }

  if (error.name === "UNAUTHENTICATED") {
    return "Συνδέσου ξανά για να συνεχίσεις.";
  }

  if (error.name === "NOT_FOUND") {
    return "Δεν βρήκαμε την επιχείρησή σου.";
  }

  return "Δεν μπορέσαμε να αποθηκεύσουμε τις ειδοποιήσεις.";
}

/**
 * Saves owner notification settings from the dashboard form.
 *
 * @param formData - Notification toggle and lead-time fields.
 * @returns A typed action result for the notifications editor.
 */
export async function saveNotificationSettingsAction(
  formData: FormData
): Promise<NotificationSettingsActionResult> {
  const input = {
    confirmation_enabled: parseBoolean(formData.get("confirmation_enabled")),
    reminder_enabled: parseBoolean(formData.get("reminder_enabled")),
    reminder_lead_minutes: parseLeadMinutes(
      formData.get("reminder_lead_minutes")
    )
  };
  const parsed = updateNotificationSettingsSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: "Έλεγξε τις ειδοποιήσεις και δοκίμασε ξανά."
    };
  }

  try {
    const context = await getOwnerBusinessContext();
    const nextSettings = {
      ...parseStoredSettings(context.business.notificationSettings),
      ...parsed.data
    };

    await prisma.business.update({
      where: {
        id: context.business.id
      },
      data: {
        notificationSettings: nextSettings
      }
    });

    revalidatePath("/dashboard/notifications");
    return { ok: true };
  } catch (error) {
    console.error("Failed to save notification settings", {
      error,
      input
    });
    return {
      ok: false,
      error: mapNotificationError(error)
    };
  }
}
