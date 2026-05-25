import { Clock } from "lucide-react";
import type { ProfileService } from "./BusinessProfile";

type ServicesListProps = {
  services: ProfileService[];
};

function formatPrice(priceCents: number, currency: string): string {
  const value = (priceCents / 100).toLocaleString("el-GR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  });

  if (currency === "EUR") {
    return `€${value}`;
  }

  return `${value} ${currency}`;
}

export function ServicesList({ services }: ServicesListProps): JSX.Element {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">Υπηρεσίες</h2>
        <span className="text-sm text-slate-500">{services.length} επιλογές</span>
      </div>
      <div className="flex flex-col gap-3">
        {services.map((service) => (
          <article
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            key={service.id}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-slate-900">
                  {service.name}
                </h3>
                <p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-500">
                  <Clock aria-hidden="true" className="h-4 w-4" />
                  {service.durationMinutes} λεπτά
                </p>
              </div>
              <p className="shrink-0 text-base font-semibold text-slate-900">
                {formatPrice(service.priceCents, service.currency)}
              </p>
            </div>
            {service.description ? (
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                {service.description}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
