import { redirect } from "next/navigation";
import { getOwnerBusiness } from "@/lib/dashboard-server";
import { prisma } from "@/lib/db";
import { VisibilityClient } from "./VisibilityClient";

export default async function VisibilityPage(): Promise<JSX.Element> {
  const managed = await getOwnerBusiness();
  const business = managed ? await prisma.business.findUnique({
    where: { id: managed.id },
    select: {
      id: true,
      showOnLanding: true
    }
  }) : null;

  if (!business) {
    redirect("/register");
  }

  return (
    <VisibilityClient
      businessId={business.id}
      initialShowOnLanding={business.showOnLanding}
    />
  );
}
