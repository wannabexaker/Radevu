import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingTrigger } from "@/components/booking/BookingTrigger";
import { BusinessProfile } from "@/components/profile/BusinessProfile";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { isReservedSlug } from "@/lib/routing";

export const dynamic = "force-dynamic";

type BusinessPageProps = {
  params: Promise<{
    business: string;
  }>;
};

async function loadBusiness(slug: string) {
  return prisma.business.findUnique({
    where: {
      slug
    },
    select: {
      id: true,
      name: true,
      contactEmail: true,
      contactPhone: true,
      timezone: true,
      workingHours: true,
      logoUrl: true,
      photoUrl: true,
      socialLinks: true,
      mapsUrl: true,
      services: {
        where: {
          active: true
        },
        orderBy: {
          createdAt: "asc"
        },
        select: {
          id: true,
          name: true,
          durationMinutes: true,
          priceCents: true,
          currency: true,
          description: true
        }
      }
    }
  });
}

export async function generateMetadata({
  params
}: BusinessPageProps): Promise<Metadata> {
  const { business: slug } = await params;

  if (isReservedSlug(slug)) {
    return {
      title: "Radevu"
    };
  }

  const business = await prisma.business.findUnique({
    where: {
      slug
    },
    select: {
      name: true
    }
  });

  return {
    title: business ? `${business.name} · Radevu` : "Radevu"
  };
}

export default async function BusinessPage({
  params
}: BusinessPageProps): Promise<JSX.Element> {
  const { business: slug } = await params;

  if (isReservedSlug(slug)) {
    notFound();
  }

  const business = await loadBusiness(slug);

  if (!business) {
    notFound();
  }

  const profileBusiness = {
    name: business.name,
    contactEmail: business.contactEmail,
    contactPhone: business.contactPhone,
    timezone: business.timezone,
    workingHours: business.workingHours,
    logoUrl: business.logoUrl,
    photoUrl: business.photoUrl,
    socialLinks: business.socialLinks,
    mapsUrl: business.mapsUrl
  };
  const bookingBusiness = {
    id: business.id,
    name: business.name,
    timezone: business.timezone,
    workingHours: business.workingHours
  };
  const user = await getCurrentUser();
  const prefill =
    user?.userType === "customer"
      ? {
          email: user.email,
          name: user.name ?? "",
          phone: user.phone
        }
      : null;

  return (
    <>
      <BusinessProfile business={profileBusiness} services={business.services} />
      <BookingTrigger
        business={bookingBusiness}
        prefill={prefill}
        services={business.services}
      />
    </>
  );
}
