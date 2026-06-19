import {
  defaultNotificationSettings,
  notificationSettingsSchema
} from "@radevu/shared";
import type { NotificationSettingsDTO } from "@radevu/shared";
import { redirect } from "next/navigation";
import { getOwnerBusiness } from "@/lib/dashboard-server";
import { prisma } from "@/lib/db";
import { saveNotificationSettingsAction } from "./actions";
import { NotificationsEditor } from "./NotificationsEditor";

function parseStoredSettings(value: unknown): NotificationSettingsDTO {
  const parsed = notificationSettingsSchema.safeParse(value);
  return parsed.success ? parsed.data : defaultNotificationSettings;
}

export default async function NotificationsPage(): Promise<JSX.Element> {
  const managed = await getOwnerBusiness();
  const business = managed ? await prisma.business.findUnique({
    where: { id: managed.id },
    select: {
      notificationSettings: true
    }
  }) : null;

  if (!business) {
    redirect("/register");
  }

  return (
    <NotificationsEditor
      initialSettings={parseStoredSettings(business.notificationSettings)}
      saveNotificationSettingsAction={saveNotificationSettingsAction}
    />
  );
}
