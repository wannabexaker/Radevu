import { parseWorkingHours } from "@radevu/shared";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveHoursAction } from "./actions";
import { HoursEditor } from "./HoursEditor";

export default async function HoursSettingsPage(): Promise<JSX.Element> {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect("/login");
  }

  const business = await prisma.business.findUnique({
    where: {
      ownerId: session.user.id
    },
    select: {
      workingHours: true
    }
  });

  if (!business) {
    redirect("/register");
  }

  return (
    <HoursEditor
      initialWorkingHours={parseWorkingHours(business.workingHours)}
      saveHoursAction={saveHoursAction}
    />
  );
}
