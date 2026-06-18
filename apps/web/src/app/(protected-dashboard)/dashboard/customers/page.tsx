import Link from "next/link";
import { UserRound } from "lucide-react";
import { redirect } from "next/navigation";
import { CustomerCard } from "@/components/dashboard/CustomerCard";
import { CustomerSearchBox } from "@/components/dashboard/CustomerSearchBox";
import { Button } from "@/components/ui/button";
import { listCustomers } from "@/lib/customers";
import { getOwnerBusiness } from "@/lib/dashboard-server";

export const dynamic = "force-dynamic";

type CustomersPageProps = {
  searchParams: Promise<{
    cursor?: string;
    search?: string;
  }>;
};

function loadMoreHref(
  searchParams: Awaited<CustomersPageProps["searchParams"]>,
  cursor: string
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (value) {
      params.set(key, value);
    }
  }

  params.set("cursor", cursor);
  return `/dashboard/customers?${params.toString()}`;
}

export default async function CustomersPage({
  searchParams
}: CustomersPageProps): Promise<JSX.Element> {
  const business = await getOwnerBusiness();

  if (!business) {
    redirect("/register");
  }

  const params = await searchParams;
  const result = await listCustomers(business.id, {
    cursor: params.cursor,
    search: params.search,
    take: 50
  });

  return (
    <section className="flex flex-col gap-6 pb-20">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold leading-tight text-slate-900">
          Πελάτες
        </h1>
        <p className="text-base leading-relaxed text-slate-500">
          Όλοι όσοι έχουν κάνει κράτηση στην επιχείρησή σου.
        </p>
      </header>
      <CustomerSearchBox query={params.search ?? ""} />
      {result.items.length === 0 ? (
        <section className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-6 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-indigo-500">
            <UserRound aria-hidden="true" className="h-6 w-6" />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Δεν υπάρχουν πελάτες ακόμα
          </h2>
          <p className="mt-2 max-w-sm text-base leading-relaxed text-slate-600">
            Οι πελάτες θα εμφανίζονται εδώ μόλις γίνει η πρώτη κράτηση.
          </p>
        </section>
      ) : (
        <div className="flex flex-col gap-3">
          {result.items.map((customer) => (
            <CustomerCard
              customer={customer}
              key={customer.id}
              timezone={business.timezone}
            />
          ))}
        </div>
      )}
      {result.nextCursor ? (
        <Button asChild className="w-full" variant="outline">
          <Link href={loadMoreHref(params, result.nextCursor)}>
            Φόρτωσε κι άλλους
          </Link>
        </Button>
      ) : null}
    </section>
  );
}
