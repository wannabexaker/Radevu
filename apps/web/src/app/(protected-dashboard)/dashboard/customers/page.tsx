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
          Î ÎµÎ»Î¬Ï„ÎµÏ‚
        </h1>
        <p className="mt-2 text-base text-slate-500">
          ÎŒÎ»Î¿Î¹ ÏŒÏƒÎ¿Î¹ Î­Ï‡Î¿Ï…Î½ ÎºÎ¬Î½ÎµÎ¹ ÎºÏÎ¬Ï„Î·ÏƒÎ· ÏƒÏ„Î·Î½ ÎµÏ€Î¹Ï‡ÎµÎ¯ÏÎ·ÏƒÎ® ÏƒÎ¿Ï….
        </p>
      </div>
      <CustomerSearchBox query={params.search ?? ""} />
      {result.items.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-4 text-base leading-relaxed text-slate-700">
          Î”ÎµÎ½ Î­Ï‡ÎµÎ¹Ï‚ Ï€ÎµÎ»Î¬Ï„ÎµÏ‚ Î±ÎºÏŒÎ¼Î±. Î˜Î± ÎµÎ¼Ï†Î±Î½Î¯Î¶Î¿Î½Ï„Î±Î¹ ÎµÎ´ÏŽ Î¼ÏŒÎ»Î¹Ï‚ Î³Î¯Î½ÎµÎ¹ Î· Ï€ÏÏŽÏ„Î·
          ÎºÏÎ¬Ï„Î·ÏƒÎ·.
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
            Î¦ÏŒÏÏ„Ï‰ÏƒÎµ ÎºÎ¹ Î¬Î»Î»Î¿Ï…Ï‚
          </Link>
        </Button>
      ) : null}
    </section>
  );
}
