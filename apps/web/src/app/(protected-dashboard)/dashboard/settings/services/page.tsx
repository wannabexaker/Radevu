import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ServicesClient } from "./ServicesClient";

export default async function ServicesPage(): Promise<JSX.Element> {
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
      id: true,
      services: {
        orderBy: {
          createdAt: "asc"
        },
        select: {
          id: true,
          businessId: true,
          name: true,
          durationMinutes: true,
          priceCents: true,
          currency: true,
          description: true,
          active: true,
          createdAt: true,
          updatedAt: true
        }
      }
    }
  });

  if (!business) {
    redirect("/dashboard/register");
  }

  return (
    <ServicesClient
      businessId={business.id}
      initialServices={business.services.map((service) => ({
        id: service.id,
        business_id: service.businessId,
        name: service.name,
        duration_minutes: service.durationMinutes,
        price_cents: service.priceCents,
        currency: service.currency,
        description: service.description,
        active: service.active,
        created_at: service.createdAt.toISOString(),
        updated_at: service.updatedAt.toISOString()
      }))}
    />
  );
}
