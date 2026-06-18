import { BriefcaseBusiness } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { prisma } from "@/lib/db";

/**
 * Renders opted-in businesses on the landing page showcase.
 *
 * @returns A server-rendered showcase grid or the locked empty state.
 */
export async function Showcase(): Promise<JSX.Element> {
  const businesses = await prisma.business.findMany({
    where: {
      showOnLanding: true
    },
    orderBy: {
      createdAt: "asc"
    },
    select: {
      id: true,
      logoUrl: true,
      name: true,
      slug: true
    }
  });

  return (
    <section className="bg-slate-50 px-4 py-12 md:px-8 md:py-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="max-w-[900px]">
          <p className="text-sm font-semibold uppercase text-indigo-500">
            Επιχειρήσεις στο Radevu
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
            Οι πρώτοι επαγγελματίες που μπαίνουν στο Radevu.
          </h2>
        </div>

        {businesses.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 text-center">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <BriefcaseBusiness aria-hidden="true" className="h-6 w-6" />
            </span>
            <p className="max-w-md text-base leading-relaxed text-slate-600">
              Σύντομα - οι πρώτοι επαγγελματίες που μπαίνουν στο Radevu.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {businesses.map((business) => (
              <Link
                className="flex min-h-24 items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-indigo-200 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                data-slug={business.slug}
                data-testid="showcase-card"
                href={`/${business.slug}`}
                key={business.id}
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                  {business.logoUrl?.startsWith("/") ? (
                    <Image
                      alt={business.name}
                      height={56}
                      src={business.logoUrl}
                      width={56}
                    />
                  ) : (
                    <Logo size="sm" />
                  )}
                </span>
                <h3 className="text-lg font-semibold text-slate-900">
                  {business.name}
                </h3>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
