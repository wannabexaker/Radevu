import { redirect } from "next/navigation";
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
    <section className="flex flex-col gap-4 pb-20">
      <div>
        <h1 className="text-3xl font-bold leading-tight text-slate-900">
          Οφειλές
        </h1>
        <p className="mt-2 text-base text-slate-500">
          Κρατήσεις που δεν έχουν πληρωθεί ακόμα.
        </p>
      </div>
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-base font-semibold text-slate-900">
          Σύνολο οφειλών: {formatPrice(totalOwedCents, currency)} από{" "}
          {groups.length} πελάτες
        </p>
      </section>
      {groups.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-4 text-base text-slate-700">
          Καμία οφειλή. Όλα πληρωμένα.
        </p>
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
