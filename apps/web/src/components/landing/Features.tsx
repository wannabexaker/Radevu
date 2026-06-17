import {
  Globe,
  Gift,
  Mail,
  Smartphone,
  Users,
  Zap,
  type LucideIcon
} from "lucide-react";

type Feature = {
  description: string;
  icon: LucideIcon;
  title: string;
};

const features: Feature[] = [
  {
    icon: Globe,
    title: "Διαδικτυακά ραντεβού",
    description:
      "Δώσε έναν σύνδεσμο, ο πελάτης κλείνει σε 60 δευτερόλεπτα από το κινητό."
  },
  {
    icon: Users,
    title: "Ιστορικό πελατών",
    description:
      "Δες με ένα πάτημα τι έχει κάνει κάθε πελάτης, τι ζήτησε, τι χρωστάει."
  },
  {
    icon: Mail,
    title: "Email + ημερολόγιο",
    description:
      "Κάθε κράτηση έρχεται με αυτόματη επιβεβαίωση και πρόσκληση στο ημερολόγιο στον πελάτη."
  },
  {
    icon: Smartphone,
    title: "Πρώτα για κινητό",
    description:
      "Σχεδιασμένο σαν εφαρμογή στο κινητό σου, όχι σαν σελίδα που απλώς προσαρμόζεται."
  },
  {
    icon: Zap,
    title: "≤2 πατήματα",
    description:
      "Από κάθε οθόνη φτάνεις σε κάθε ενέργεια σε δύο πατήματα ή λιγότερα."
  },
  {
    icon: Gift,
    title: "Δωρεάν στη δοκιμή",
    description:
      "Χρησιμοποίησέ το ελεύθερα όσο είμαστε στη δοκιμαστική περίοδο. Καμία κάρτα."
  }
];

/**
 * Renders the locked six-card landing feature grid.
 *
 * @returns The landing features section.
 */
export function Features(): JSX.Element {
  return (
    <section className="px-4 py-12 md:px-8 md:py-20" id="features">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase text-indigo-500">
            Τι κάνει
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
            Λιγότερα τηλέφωνα. Περισσότερη οργάνωση.
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                className="rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md md:p-6"
                key={feature.title}
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
                  <Icon aria-hidden="true" className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-xl font-semibold leading-tight text-slate-900 md:text-2xl">
                  {feature.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-slate-600">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
