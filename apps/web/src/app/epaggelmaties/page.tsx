import { BUSINESS_CATEGORIES } from "@radevu/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import {
  type DirectoryBusiness,
  listDirectoryBusinesses,
  normalizeDirectoryCategory,
  normalizeDirectorySearch
} from "@/lib/business-directory";
import { getCurrentUser } from "@/lib/current-user";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Επαγγελματίες · Radevu"
};

type DirectoryPageProps = {
  searchParams: Promise<{
    category?: string;
    cursor?: string;
    search?: string;
  }>;
};

function directoryHref(input: {
  category?: string | null;
  cursor?: string | null;
  search?: string | null;
}): string {
  const params = new URLSearchParams();

  if (input.search) {
    params.set("search", input.search);
  }

  if (input.category) {
    params.set("category", input.category);
  }

  if (input.cursor) {
    params.set("cursor", input.cursor);
  }

  const query = params.toString();
  return query ? `/epaggelmaties?${query}` : "/epaggelmaties";
}

function descriptionText(business: DirectoryBusiness): string {
  return (
    business.description ??
    "Δες τις υπηρεσίες, τις ώρες και κλείσε διαδικτυακά ραντεβού."
  );
}

function DirectoryCard({
  business
}: {
  business: DirectoryBusiness;
}): JSX.Element {
  const category = business.category ?? "Άλλο";

  return (
    <Link
      className="flex min-h-40 gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors active:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      href={`/${business.slug}`}
    >
      <Avatar
        alt={`${business.name} προφίλ`}
        name={business.name}
        size="md"
        src={business.logoUrl ?? business.photoUrl}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start gap-2">
          <h2 className="min-w-0 flex-1 text-lg font-semibold leading-tight text-slate-900">
            {business.name}
          </h2>
          <span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            {category}
          </span>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {descriptionText(business)}
        </p>
        <span className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white">
          Δες προφίλ
        </span>
      </div>
    </Link>
  );
}

export default async function DirectoryPage({
  searchParams
}: DirectoryPageProps): Promise<JSX.Element> {
  const params = await searchParams;
  const user = await getCurrentUser();
  const search = normalizeDirectorySearch(params.search);
  const category = normalizeDirectoryCategory(params.category);
  const result = await listDirectoryBusinesses({
    category: category ?? undefined,
    cursor: params.cursor,
    search: search ?? undefined,
    take: 24
  });

  return (
    <>
      <Header userType={user?.userType ?? null} />
      <main className="min-h-screen bg-slate-50 px-4 py-6">
        <section className="mx-auto flex max-w-4xl flex-col gap-5 pb-16">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold uppercase text-indigo-500">
              Radevu
            </p>
            <h1 className="text-3xl font-bold leading-tight text-slate-900">
              Επαγγελματίες
            </h1>
            <p className="text-base leading-7 text-slate-600">
              Βρες επιχείρηση και κλείσε ραντεβού από ένα απλό προφίλ.
            </p>
          </div>

          <form
            action="/epaggelmaties"
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="directory-search"
            >
              Αναζήτηση
            </label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <input
                className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                defaultValue={search ?? ""}
                id="directory-search"
                name="search"
                placeholder="Όνομα ή περιγραφή"
                type="search"
              />
              {category ? (
                <input name="category" type="hidden" value={category} />
              ) : null}
              <Button type="submit">Αναζήτηση</Button>
            </div>
          </form>

          <nav
            aria-label="Φίλτρο κατηγορίας"
            className="flex gap-2 overflow-x-auto pb-1"
          >
            <Link
              className={cn(
                "inline-flex min-h-10 shrink-0 items-center rounded-full border px-4 text-sm font-semibold",
                category
                  ? "border-slate-200 bg-white text-slate-700"
                  : "border-indigo-600 bg-indigo-600 text-white"
              )}
              href={directoryHref({ search })}
            >
              Όλες
            </Link>
            {BUSINESS_CATEGORIES.map((item) => (
              <Link
                className={cn(
                  "inline-flex min-h-10 shrink-0 items-center rounded-full border px-4 text-sm font-semibold",
                  category === item
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-slate-200 bg-white text-slate-700"
                )}
                href={directoryHref({ category: item, search })}
                key={item}
              >
                {item}
              </Link>
            ))}
          </nav>

          {result.items.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-white p-4 text-base leading-7 text-slate-700 shadow-sm">
              Δεν βρέθηκαν επαγγελματίες με αυτά τα φίλτρα.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {result.items.map((business) => (
                <DirectoryCard business={business} key={business.id} />
              ))}
            </div>
          )}

          {result.nextCursor ? (
            <Button asChild className="w-full" variant="outline">
              <Link
                href={directoryHref({
                  category,
                  cursor: result.nextCursor,
                  search
                })}
              >
                Φόρτωσε κι άλλα
              </Link>
            </Button>
          ) : null}
        </section>
      </main>
      <Footer />
    </>
  );
}
