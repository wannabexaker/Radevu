import { Briefcase, Clock, Globe, Settings2 } from "lucide-react";
import { SettingsMenuItem } from "@/components/settings/SettingsMenuItem";

const settingsLinks = [
  {
    description: "Όνομα, εικόνες, τηλέφωνο, email, χάρτης και social.",
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
    description: "Διάλεξε αν η επιχείρησή σου φαίνεται στο landing.",
    href: "/dashboard/settings/visibility",
    icon: Globe,
    label: "Εμφάνιση στο landing"
  }
] as const;

export default function SettingsPage(): JSX.Element {
  return (
    <section className="mx-auto flex max-w-md flex-col gap-6 pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold leading-tight text-slate-900">
          Ρυθμίσεις
        </h1>
        <p className="text-base leading-relaxed text-slate-500">
          Διαχειρίσου τα στοιχεία που βλέπουν οι πελάτες σου.
        </p>
      </div>
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
      </div>
    </section>
  );
}
