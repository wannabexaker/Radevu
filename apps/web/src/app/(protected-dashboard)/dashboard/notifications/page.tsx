import {
  defaultNotificationSettings,
  notificationSettingsSchema
} from "@radevu/shared";
import type { NotificationSettingsDTO } from "@radevu/shared";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveNotificationSettingsAction } from "./actions";
import { NotificationsEditor } from "./NotificationsEditor";

function parseStoredSettings(value: unknown): NotificationSettingsDTO {
  const parsed = notificationSettingsSchema.safeParse(value);
  return parsed.success ? parsed.data : defaultNotificationSettings;
}

export default async function NotificationsPage(): Promise<JSX.Element> {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect("/dashboard/login");
  }

  const business = await prisma.business.findUnique({
    where: {
      ownerId: session.user.id
    },
    select: {
      notificationSettings: true
    }
  });

  if (!business) {
    redirect("/dashboard/register");
  }

  return (
    <NotificationsEditor
      initialSettings={parseStoredSettings(business.notificationSettings)}
      saveNotificationSettingsAction={saveNotificationSettingsAction}
    />
  );
}
