import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { VisibilityClient } from "./VisibilityClient";

export default async function VisibilityPage(): Promise<JSX.Element> {
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
      id: true,
      showOnLanding: true
    }
  });

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
