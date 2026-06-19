import { redirect } from "next/navigation";
import { getOwnerBusiness } from "@/lib/dashboard-server";
import { prisma } from "@/lib/db";
import { ServicesClient } from "./ServicesClient";

export default async function ServicesPage(): Promise<JSX.Element> {
  const managed = await getOwnerBusiness();
  const business = managed ? await prisma.business.findUnique({
    where: { id: managed.id },
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
  }) : null;

  if (!business) {
    redirect("/register");
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
