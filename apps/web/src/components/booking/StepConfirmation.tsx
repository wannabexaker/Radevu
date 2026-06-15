"use client";

import { formatGreekDateTime } from "@radevu/shared";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ConfirmedAppointment } from "./BookingFlow";

type StepConfirmationProps = {
  appointment: ConfirmedAppointment;
  businessName: string;
  customerEmail: string | null;
  customerManageUrl: string | null;
  onClose: () => void;
  timezone: string;
};

export function StepConfirmation({
  appointment,
  businessName,
  customerEmail,
  customerManageUrl,
  onClose,
  timezone
}: StepConfirmationProps): JSX.Element {
  return (
    <section className="flex min-h-full flex-col justify-center gap-6 py-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white">
        <Check aria-hidden="true" className="h-8 w-8" />
      </div>
      <div>
        <h2 className="text-3xl font-bold leading-tight text-slate-900">
          Έγινε κράτηση!
        </h2>
        <p className="mt-3 text-base leading-relaxed text-slate-500">
          {customerEmail ? (
            <>
              Στείλαμε επιβεβαίωση στο{" "}
              <strong className="font-semibold text-slate-900">
                {customerEmail}
              </strong>
              . Έλεγξε και το spam folder.
            </>
          ) : (
            "Η κράτηση καταχωρήθηκε. Η επιχείρηση θα σε ενημερώσει."
          )}
        </p>
      </div>
      <dl className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm">
        <div className="flex justify-between gap-4 py-2">
          <dt className="text-sm text-slate-500">Επιχείρηση</dt>
          <dd className="text-right text-sm font-medium text-slate-900">
            {businessName}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-slate-200 py-2">
          <dt className="text-sm text-slate-500">Υπηρεσία</dt>
          <dd className="text-right text-sm font-medium text-slate-900">
            {appointment.service_name}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-slate-200 py-2">
          <dt className="text-sm text-slate-500">Ώρα</dt>
          <dd className="text-right text-sm font-medium text-slate-900">
            {formatGreekDateTime(new Date(appointment.starts_at), timezone)}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-slate-200 py-2">
          <dt className="text-sm text-slate-500">Όνομα</dt>
          <dd className="text-right text-sm font-medium text-slate-900">
            {appointment.customer_name}
          </dd>
        </div>
      </dl>
      {customerManageUrl ? (
        <Button asChild className="w-full" variant="outline">
          <a href={customerManageUrl}>Σημειώσεις και μηνύματα</a>
        </Button>
      ) : null}
      <Button className="w-full" onClick={onClose} type="button">
        Κλείσε
      </Button>
    </section>
  );
}
