"use client";

import { Clock } from "lucide-react";
import type { BookingService } from "./BookingFlow";

type StepServicePickerProps = {
  onSelect: (service: BookingService) => void;
  services: BookingService[];
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

export function StepServicePicker({
  onSelect,
  services
}: StepServicePickerProps): JSX.Element {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">
          Διάλεξε υπηρεσία
        </h2>
        <p className="mt-2 text-base text-slate-500">
          Πάτα την υπηρεσία που θέλεις.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {services.map((service) => (
          <button
            className="min-h-24 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-colors active:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            data-testid="service-option"
            key={service.id}
            onClick={() => onSelect(service)}
            type="button"
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
              <span className="shrink-0 text-base font-semibold text-slate-900">
                {formatPrice(service.priceCents, service.currency)}
              </span>
            </div>
            {service.description ? (
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                {service.description}
              </p>
            ) : null}
          </button>
        ))}
      </div>
    </section>
  );
}
