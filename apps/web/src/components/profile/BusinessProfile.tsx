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
      <ProfileHero business={business} />
      <WorkingHoursSummary workingHours={business.workingHours} />
      <ServicesList services={services} />
      <ContactInfo email={business.contactEmail} phone={business.contactPhone} />
      <SocialLinks socialLinks={business.socialLinks} />
      <MapsLink mapsUrl={business.mapsUrl} />
    </main>
  );
}
