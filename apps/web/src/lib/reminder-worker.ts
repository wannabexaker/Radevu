import { sendBookingReminder } from "@radevu/email";
import {
  defaultNotificationSettings,
  notificationSettingsSchema
} from "@radevu/shared";
import type { NotificationSettingsDTO } from "@radevu/shared";
import { prisma } from "@/lib/db";
import { getResendEmailConfig } from "@/lib/email-config";
import { env } from "@/lib/env";
import { fetchDue } from "@/lib/reminder-queue";

const reminderWorkerIntervalMs = 60_000;
const reminderBatchSize = 50;

type ReminderWorkerGlobal = typeof globalThis & {
  __radevu_reminder_worker_started__?: boolean;
  __radevu_reminder_worker_timer__?: ReturnType<typeof setInterval>;
};

const globalForReminderWorker = globalThis as ReminderWorkerGlobal;

function parseNotificationSettings(value: unknown): NotificationSettingsDTO {
  const parsed = notificationSettingsSchema.safeParse(value);

  if (!parsed.success) {
    console.warn("[reminder-worker] invalid notification settings, using default", {
      issues: parsed.error.issues
    });
    return defaultNotificationSettings;
  }

  return parsed.data;
}

function emailConfig(): { resendApiKey: string; resendFromEmail: string } | null {
  return getResendEmailConfig("[reminder-worker] reminder");
}

async function processReminder(appointmentId: string): Promise<void> {
  const appointment = await prisma.appointment.findUnique({
    where: {
      id: appointmentId
    },
    include: {
      business: {
        select: {
          contactEmail: true,
          contactPhone: true,
          mapsUrl: true,
          name: true,
          notificationSettings: true,
          owner: {
            select: {
              email: true
            }
          },
          timezone: true
        }
      },
      customer: {
        select: {
          email: true,
          name: true,
          phone: true
        }
      },
      service: {
        select: {
          name: true
        }
      }
    }
  });

  if (!appointment) {
    console.warn("[reminder-worker] appointment missing, skipping reminder", {
      appointment_id: appointmentId
    });
    return;
  }

  if (appointment.status !== "scheduled") {
    console.info("[reminder-worker] appointment not scheduled, skipping reminder", {
      appointment_id: appointment.id,
      status: appointment.status
    });
    return;
  }

  const settings = parseNotificationSettings(
    appointment.business.notificationSettings
  );

  if (!settings.reminder_enabled) {
    console.info("[reminder-worker] reminder disabled for business, skipping", {
      appointment_id: appointment.id
    });
    return;
  }

  if (!appointment.customer.email) {
    console.info("[reminder-worker] customer has no email, skipping reminder", {
      appointment_id: appointment.id,
      customer_name: appointment.customer.name
    });
    return;
  }

  const config = emailConfig();

  if (!config) {
    console.info("[reminder-worker] reminder email skipped", {
      appointment_id: appointment.id,
      has_resend_api_key: Boolean(env.RESEND_API_KEY),
      has_resend_from_email: Boolean(env.RESEND_FROM_EMAIL)
    });
    return;
  }

  await sendBookingReminder({
    ...config,
    appointment: {
      startsAt: appointment.startsAt
    },
    business: {
      contactEmail: appointment.business.contactEmail,
      contactPhone: appointment.business.contactPhone,
      mapsUrl: appointment.business.mapsUrl,
      name: appointment.business.name
    },
    customer: appointment.customer,
    service: appointment.service,
    timezone: appointment.business.timezone,
    to: appointment.customer.email
  });

  console.info("[reminder-worker] reminder sent", {
    appointment_id: appointment.id,
    recipient: appointment.customer.email
  });
}

async function runReminderTick(): Promise<void> {
  const appointmentIds = await fetchDue(new Date(), reminderBatchSize);

  if (appointmentIds.length === 0) {
    return;
  }

  console.info("[reminder-worker] claimed due reminders", {
    count: appointmentIds.length
  });

  await Promise.all(
    appointmentIds.map(async (appointmentId) => {
      try {
        await processReminder(appointmentId);
      } catch (error) {
        console.error("[reminder-worker] reminder job failed", {
          appointment_id: appointmentId,
          error
        });
      }
    })
  );
}

/**
 * Starts the single-process reminder worker for due Redis queue items.
 *
 * The worker is best-effort: each due reminder is claimed once, Resend failures
 * are logged per job, and failed jobs are not retried in Phase 1.
 *
 * @returns Nothing; the interval is kept in global state.
 */
export function startReminderWorker(): void {
  if (globalForReminderWorker.__radevu_reminder_worker_started__) {
    return;
  }

  globalForReminderWorker.__radevu_reminder_worker_started__ = true;
  globalForReminderWorker.__radevu_reminder_worker_timer__ = setInterval(() => {
    void runReminderTick().catch((error) => {
      console.error("[reminder-worker] tick failed", {
        error
      });
    });
  }, reminderWorkerIntervalMs);
  globalForReminderWorker.__radevu_reminder_worker_timer__.unref?.();

  console.info("[reminder-worker] started, tick=60s");
  void runReminderTick().catch((error) => {
    console.error("[reminder-worker] initial tick failed", {
      error
    });
  });
}
