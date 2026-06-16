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
          ÎŸÏ†ÎµÎ¹Î»Î­Ï‚
        </h1>
        <p className="mt-2 text-base text-slate-500">
          ÎšÏÎ±Ï„Î®ÏƒÎµÎ¹Ï‚ Ï€Î¿Ï… Î´ÎµÎ½ Î­Ï‡Î¿Ï…Î½ Ï€Î»Î·ÏÏ‰Î¸ÎµÎ¯ Î±ÎºÏŒÎ¼Î±.
        </p>
      </div>
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-base font-semibold text-slate-900">
          Î£ÏÎ½Î¿Î»Î¿ Î¿Ï†ÎµÎ¹Î»ÏŽÎ½: {formatPrice(totalOwedCents, currency)} Î±Ï€ÏŒ{" "}
          {groups.length} Ï€ÎµÎ»Î¬Ï„ÎµÏ‚
        </p>
      </section>
      {groups.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-4 text-base text-slate-700">
          ÎšÎ±Î¼Î¯Î± Î¿Ï†ÎµÎ¹Î»Î®. ÎŒÎ»Î± Ï€Î»Î·ÏÏ‰Î¼Î­Î½Î±.
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
