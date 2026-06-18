import { Avatar } from "@/components/ui/Avatar";
import type { ProfileBusiness } from "./BusinessProfile";

type ProfileHeroProps = {
  business: Pick<ProfileBusiness, "logoUrl" | "name" | "photoUrl">;
};

export function ProfileHero({ business }: ProfileHeroProps): JSX.Element {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-center pt-2">
        <Avatar
          alt={`${business.name} λογότυπο`}
          name={business.name}
          size="lg"
          src={business.logoUrl}
        />
      </div>
      {business.photoUrl ? (
        <img
          alt={business.name}
          className="aspect-[4/3] w-full rounded-2xl border border-slate-200 object-cover shadow-sm"
          src={business.photoUrl}
        />
      ) : (
        <div
          aria-hidden="true"
          className="aspect-[4/3] w-full rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-100 to-indigo-300 shadow-sm"
        />
      )}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-indigo-500">Κλείσε ραντεβού</p>
        <h1 className="text-3xl font-bold leading-tight text-slate-900">
          {business.name}
        </h1>
      </div>
    </section>
  );
}
