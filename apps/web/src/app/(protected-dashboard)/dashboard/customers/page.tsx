import Link from "next/link";
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
    <section className="flex flex-col gap-4 pb-20">
      <div>
        <h1 className="text-3xl font-bold leading-tight text-slate-900">
          Πελάτες
        </h1>
        <p className="mt-2 text-base text-slate-500">
          Όλοι όσοι έχουν κάνει κράτηση στην επιχείρησή σου.
        </p>
      </div>
      <CustomerSearchBox query={params.search ?? ""} />
      {result.items.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-4 text-base leading-relaxed text-slate-700">
          Δεν έχεις πελάτες ακόμα. Θα εμφανίζονται εδώ μόλις γίνει η πρώτη
          κράτηση.
        </p>
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
