import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { ContactInfo } from "./ContactInfo";
import { MapsLink } from "./MapsLink";
import { ProfileHero } from "./ProfileHero";
import { ServicesList } from "./ServicesList";
import { SocialLinks } from "./SocialLinks";
import { WorkingHoursSummary } from "./WorkingHoursSummary";

export type ProfileBusiness = {
  name: string;
  contactEmail: string | null;
  contactPhone: string | null;
  timezone: string;
  workingHours: unknown;
  logoUrl: string | null;
  photoUrl: string | null;
  socialLinks: unknown;
  mapsUrl: string | null;
};

export type ProfileService = {
  id: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
  currency: string;
  description: string | null;
};

type BusinessProfileProps = {
  business: ProfileBusiness;
  services: ProfileService[];
};

export function BusinessProfile({
  business,
  services
}: BusinessProfileProps): JSX.Element {
  return (
    <main className="flex min-h-screen flex-col gap-5 px-4 pb-24 pt-6">
      <nav
        aria-label="Breadcrumb"
        className="flex min-h-11 items-center whitespace-nowrap text-sm text-slate-500"
      >
        <Link
          className="inline-flex min-h-11 min-w-11 items-center rounded-md transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          href="/"
        >
          Αρχική
        </Link>
        <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0" />
        <Link
          className="inline-flex min-h-11 items-center rounded-md px-1 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          href="/epaggelmaties"
        >
          Επαγγελματίες
        </Link>
      </nav>
      <ProfileHero business={business} />
      <WorkingHoursSummary workingHours={business.workingHours} />
      <ServicesList services={services} />
      <ContactInfo email={business.contactEmail} phone={business.contactPhone} />
      <SocialLinks socialLinks={business.socialLinks} />
      <MapsLink mapsUrl={business.mapsUrl} />
    </main>
  );
}
