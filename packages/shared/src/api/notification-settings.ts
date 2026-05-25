import { z } from "zod";

export const reminderLeadMinutesSchema = z.union([
  z.literal(720),
  z.literal(1440),
  z.literal(2880)
]);

export const defaultNotificationSettings = {
  confirmation_enabled: true,
  reminder_enabled: true,
  reminder_lead_minutes: 1440
} as const;

export const notificationSettingsSchema = z.object({
  confirmation_enabled: z.boolean(),
  reminder_enabled: z.boolean(),
  reminder_lead_minutes: reminderLeadMinutesSchema
});

export const updateNotificationSettingsSchema = notificationSettingsSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

export type NotificationSettingsDTO = z.infer<
  typeof notificationSettingsSchema
>;
export type ReminderLeadMinutes = z.infer<typeof reminderLeadMinutesSchema>;
export type UpdateNotificationSettingsInput = z.infer<
  typeof updateNotificationSettingsSchema
>;
