import { parseWorkingHours } from "@radevu/shared";
import { redirect } from "next/navigation";
import { getOwnerBusiness } from "@/lib/dashboard-server";
import { prisma } from "@/lib/db";
import { saveHoursAction } from "./actions";
import { HoursEditor } from "./HoursEditor";

export default async function HoursSettingsPage(): Promise<JSX.Element> {
  const managed = await getOwnerBusiness();
  const business = managed ? await prisma.business.findUnique({
    where: { id: managed.id },
    select: {
      workingHours: true
    }
  }) : null;

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
