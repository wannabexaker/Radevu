import { Briefcase, Clock, Globe, Settings2, UserCog } from "lucide-react";
import { headers } from "next/headers";
import { SettingsMenuItem } from "@/components/settings/SettingsMenuItem";
import { auth } from "@/lib/auth";
import { getOwnerBusiness } from "@/lib/dashboard-server";

const settingsLinks = [
  {
    description: "Όνομα, εικόνες, τηλέφωνο, Email, χάρτης και κοινωνικά δίκτυα.",
    href: "/dashboard/settings/profile",
    icon: Settings2,
    label: "Προφίλ"
  },
  {
    description: "Οι ημέρες και οι ώρες που δέχεσαι κρατήσεις.",
    href: "/dashboard/settings/hours",
    icon: Clock,
    label: "Ωράριο λειτουργίας"
  },
  {
    description: "Όνομα, διάρκεια, τιμή και ενεργές επιλογές.",
    href: "/dashboard/settings/services",
    icon: Briefcase,
    label: "Υπηρεσίες"
  },
  {
    description: "Διάλεξε αν η επιχείρησή σου φαίνεται στη βιτρίνα.",
    href: "/dashboard/settings/visibility",
    icon: Globe,
    label: "Εμφάνιση στη βιτρίνα"
  }
] as const;

export default async function SettingsPage(): Promise<JSX.Element> {
  const session = await auth.api.getSession({ headers: await headers() });
  const business = await getOwnerBusiness();
  const isOwner = Boolean(session && business?.ownerId === session.user.id);
  return (
    <section className="flex flex-col gap-6 pb-20">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold leading-tight text-slate-900">
          Ρυθμίσεις
        </h1>
        <p className="text-base leading-relaxed text-slate-500">
          Διαχειρίσου τα στοιχεία που βλέπουν οι πελάτες σου.
        </p>
      </header>
      <div className="flex flex-col gap-3">
        {settingsLinks.map((item) => (
          <SettingsMenuItem
            description={item.description}
            href={item.href}
            icon={item.icon}
            key={item.href}
            label={item.label}
          />
        ))}
        {isOwner ? (
          <SettingsMenuItem
            description="Πρόσθεσε ή αφαίρεσε τον δεύτερο διαχειριστή της επιχείρησης."
            href="/dashboard/settings/managers"
            icon={UserCog}
            label="Διαχειριστές"
          />
        ) : null}
      </div>
    </section>
  );
}
