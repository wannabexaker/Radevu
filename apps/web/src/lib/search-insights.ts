import { prisma } from "@/lib/db";

export const INSIGHTS_WINDOWS = [7, 30, 90] as const;

export type InsightsWindowDays = (typeof INSIGHTS_WINDOWS)[number];

export type InsightsRow = {
  count: number;
  label: string;
};

export type SearchInsights = {
  emptyResultSearches: InsightsRow[];
  signedInSearches: number;
  topCategories: InsightsRow[];
  topSearches: InsightsRow[];
  totalSearches: number;
};

/**
 * Coerces a query-string window into one of the supported ranges.
 *
 * @param value - Raw `window` search param.
 * @returns The matching window, defaulting to 30 days.
 */
export function parseInsightsWindow(
  value: string | undefined
): InsightsWindowDays {
  const numeric = Number(value);
  return INSIGHTS_WINDOWS.find((option) => option === numeric) ?? 30;
}

function windowStart(days: InsightsWindowDays): Date {
  return new Date(Date.now() - days * 24 * 60 * 60_000);
}

/**
 * Aggregates directory search activity for the founder insights page.
 *
 * Every figure is an aggregate — counts grouped by term or category, never a
 * list of who searched what. Individual rows stay private to the person who
 * made them.
 *
 * @param days - How far back to look.
 * @returns Totals plus the top terms, categories, and searches that found nothing.
 */
export async function getSearchInsights(
  days: InsightsWindowDays
): Promise<SearchInsights> {
  const since = windowStart(days);
  const createdAt = { gte: since };

  const [
    totalSearches,
    signedInSearches,
    groupedQueries,
    groupedCategories,
    groupedEmpty
  ] = await Promise.all([
    prisma.searchEvent.count({ where: { createdAt } }),
    prisma.searchEvent.count({
      where: { createdAt, userId: { not: null } }
    }),
    prisma.searchEvent.groupBy({
      by: ["query"],
      orderBy: { _count: { query: "desc" } },
      take: 15,
      where: { createdAt, query: { not: null } },
      _count: { query: true }
    }),
    prisma.searchEvent.groupBy({
      by: ["category"],
      orderBy: { _count: { category: "desc" } },
      take: 15,
      where: { category: { not: null }, createdAt },
      _count: { category: true }
    }),
    prisma.searchEvent.groupBy({
      by: ["query"],
      orderBy: { _count: { query: "desc" } },
      take: 10,
      where: { createdAt, query: { not: null }, resultsCount: 0 },
      _count: { query: true }
    })
  ]);

  return {
    emptyResultSearches: groupedEmpty.map((row) => ({
      count: row._count.query,
      label: row.query ?? ""
    })),
    signedInSearches,
    topCategories: groupedCategories.map((row) => ({
      count: row._count.category,
      label: row.category ?? ""
    })),
    topSearches: groupedQueries.map((row) => ({
      count: row._count.query,
      label: row.query ?? ""
    })),
    totalSearches
  };
}
