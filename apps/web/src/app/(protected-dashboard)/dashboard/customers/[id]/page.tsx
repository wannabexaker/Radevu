import type { Metadata } from "next";
import { ChevronLeft, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CustomerAppointmentRow } from "@/components/dashboard/CustomerAppointmentRow";
import { CustomerAvatar } from "@/components/dashboard/CustomerAvatar";
import { CustomerNotesForm } from "@/components/dashboard/CustomerNotesForm";
import { CustomerStatsBlock } from "@/components/dashboard/CustomerStatsBlock";
import { saveCustomerNotes } from "@/app/(protected-dashboard)/dashboard/customers/[id]/actions";
import { getCustomer } from "@/lib/customers";
import { getOwnerBusiness } from "@/lib/dashboard-server";

export const dynamic = "force-dynamic";

type CustomerDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function contactText(email: string | null, phone: string | null): string {
  if (phone && email) {
    return `${phone} · ${email}`;
  }

  return phone ?? email ?? "Δεν δόθηκε επικοινωνία";
}

export async function generateMetadata({
  params
}: CustomerDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const business = await getOwnerBusiness();

  if (!business) {
    return {
      title: "Πελάτης"
    };
  }

  const customer = await getCustomer(business.id, id);

  return {
    title: customer ? `${customer.name} · Πελάτες` : "Πελάτης"
  };
}

export default async function CustomerDetailPage({
  params
}: CustomerDetailPageProps): Promise<JSX.Element> {
  const { id } = await params;
  const business = await getOwnerBusiness();

  if (!business) {
    redirect("/register");
  }

  const customer = await getCustomer(business.id, id);

  if (!customer) {
    notFound();
  }

  return (
    <section className="flex flex-col gap-4 pb-20">
      <Link
        className="inline-flex min-h-11 w-fit items-center gap-1 rounded-xl px-1 text-sm font-medium text-slate-700 active:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        href="/dashboard/customers"
      >
        <ChevronLeft aria-hidden="true" className="h-5 w-5" />
        Πελάτες
      </Link>

      <header className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <CustomerAvatar name={customer.name} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold leading-tight text-slate-900">
              {customer.name}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {contactText(customer.email, customer.phone)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {customer.phone ? (
                <a
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 active:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  href={`tel:${customer.phone}`}
                >
                  <Phone aria-hidden="true" className="h-4 w-4" />
                  Τηλέφωνο
                </a>
              ) : null}
              {customer.email ? (
                <a
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 active:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  href={`mailto:${customer.email}`}
                >
                  <Mail aria-hidden="true" className="h-4 w-4" />
                  Email
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <CustomerStatsBlock customer={customer} timezone={business.timezone} />
      <CustomerNotesForm
        customerId={customer.id}
        futureRecommendation={customer.futureRecommendation}
        notes={customer.notes}
        onSave={saveCustomerNotes}
      />

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Ιστορικό κρατήσεων
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Πιο πρόσφατες πρώτα.
          </p>
        </div>
        {customer.appointments.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-4 text-base text-slate-700">
            Δεν υπάρχει ιστορικό κρατήσεων ακόμα.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {customer.appointments.map((appointment) => (
              <CustomerAppointmentRow
                appointment={appointment}
                key={appointment.id}
                timezone={business.timezone}
              />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
