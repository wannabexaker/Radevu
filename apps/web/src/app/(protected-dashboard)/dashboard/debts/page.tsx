import { redirect } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { DebtSection } from "@/components/dashboard/DebtSection";
import { markDebtPaid } from "@/app/(protected-dashboard)/dashboard/debts/actions";
import { getOwnerBusiness } from "@/lib/dashboard-server";
import { listUnpaidByCustomer } from "@/lib/customers";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DebtsPage(): Promise<JSX.Element> {
  const business = await getOwnerBusiness();

  if (!business) {
    redirect("/register");
  }

  const groups = await listUnpaidByCustomer(business.id);
  const totalOwedCents = groups.reduce(
    (total, group) => total + group.totalOwedCents,
    0
  );
  const currency = groups[0]?.appointments[0]?.service.currency ?? "EUR";

  return (
    <section className="flex flex-col gap-6 pb-20">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold leading-tight text-slate-900">
          Οφειλές
        </h1>
        <p className="text-base leading-relaxed text-slate-500">
          Κρατήσεις που δεν έχουν πληρωθεί ακόμα.
        </p>
      </header>
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-base font-semibold text-slate-900">
          Σύνολο οφειλών: {formatPrice(totalOwedCents, currency)} από{" "}
          {groups.length} πελάτες
        </p>
      </section>
      {groups.length === 0 ? (
        <section className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-6 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CircleCheck aria-hidden="true" className="h-6 w-6" />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Δεν υπάρχουν οφειλές
          </h2>
          <p className="mt-2 text-base text-slate-600">
            Όλες οι κρατήσεις είναι πληρωμένες.
          </p>
        </section>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <DebtSection
              group={group}
              key={group.customer.id}
              onMarkPaid={markDebtPaid}
              timezone={business.timezone}
            />
          ))}
        </div>
      )}
    </section>
  );
}
