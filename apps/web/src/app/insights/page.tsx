import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { isFounderEmail } from "@/lib/founder";
import {
  INSIGHTS_WINDOWS,
  getSearchInsights,
  parseInsightsWindow,
  type InsightsRow
} from "@/lib/search-insights";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: "Insights · Radevu"
};

type InsightsPageProps = {
  searchParams: Promise<{ window?: string }>;
};

function BarList({
  emptyMessage,
  rows,
  title
}: {
  emptyMessage: string;
  rows: InsightsRow[];
  title: string;
}): JSX.Element {
  const max = rows.reduce((highest, row) => Math.max(highest, row.count), 0);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {rows.map((row) => (
            <li className="flex flex-col gap-1" key={row.label}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm text-slate-800">
                  {row.label}
                </span>
                <span className="shrink-0 text-sm font-semibold text-slate-900">
                  {row.count}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{
                    width: `${max > 0 ? Math.round((row.count / max) * 100) : 0}%`
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function InsightsPage({
  searchParams
}: InsightsPageProps): Promise<JSX.Element> {
  const user = await getCurrentUser();

  // 404 rather than 403: a stranger should not learn that this page exists.
  if (!isFounderEmail(user?.email)) {
    notFound();
  }

  const params = await searchParams;
  const windowDays = parseInsightsWindow(params.window);
  const insights = await getSearchInsights(windowDays);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 pb-16">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold leading-tight text-slate-900">
            Τι ψάχνει ο κόσμος
          </h1>
          <p className="text-base leading-7 text-slate-600">
            Συγκεντρωτικά στοιχεία αναζητήσεων στον κατάλογο. Δεν εμφανίζεται
            ποιος έψαξε τι.
          </p>
        </header>

        <nav className="flex gap-2">
          {INSIGHTS_WINDOWS.map((option) => (
            <Link
              className={
                option === windowDays
                  ? "inline-flex min-h-11 items-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white"
                  : "inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700"
              }
              href={`/insights?window=${option}`}
              key={option}
            >
              {option} ημέρες
            </Link>
          ))}
        </nav>

        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Αναζητήσεις</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">
              {insights.totalSearches}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Από συνδεδεμένους</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">
              {insights.signedInSearches}
            </p>
          </div>
        </section>

        <BarList
          emptyMessage="Καμία αναζήτηση με κείμενο ακόμα."
          rows={insights.topSearches}
          title="Πιο συχνές αναζητήσεις"
        />
        <BarList
          emptyMessage="Κανένα φίλτρο κατηγορίας ακόμα."
          rows={insights.topCategories}
          title="Πιο συχνές κατηγορίες"
        />
        <BarList
          emptyMessage="Κάθε αναζήτηση βρήκε κάτι."
          rows={insights.emptyResultSearches}
          title="Αναζητήσεις χωρίς αποτέλεσμα"
        />
        <p className="text-sm leading-6 text-slate-500">
          Οι αναζητήσεις χωρίς αποτέλεσμα δείχνουν τι λείπει από τον κατάλογο —
          είναι η πιο χρήσιμη λίστα εδώ.
        </p>
      </div>
    </main>
  );
}
