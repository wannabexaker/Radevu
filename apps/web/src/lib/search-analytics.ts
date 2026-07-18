import { prisma } from "@/lib/db";

const MAX_QUERY_LENGTH = 80;

export type RecordSearchEventInput = {
  category: string | null;
  ip: string | null;
  query: string | null;
  resultsCount: number;
  userId: string | null;
};

/**
 * Normalises a search term for analytics.
 *
 * Lower-cased and whitespace-collapsed so that "Κομμωτηριο", "κομμωτηριο " and
 * "κομμωτηριο" aggregate into one row instead of three.
 *
 * @param query - Raw search text as typed.
 * @returns The normalised term, or null when there is nothing to record.
 */
export function normalizeSearchTerm(query: string | null): string | null {
  const value = query?.trim().replace(/\s+/g, " ").toLowerCase();
  return value ? value.slice(0, MAX_QUERY_LENGTH) : null;
}

async function persistSearchEvent(
  input: RecordSearchEventInput
): Promise<void> {
  await prisma.searchEvent.create({
    data: {
      category: input.category,
      ip: input.ip,
      query: input.query,
      resultsCount: input.resultsCount,
      userId: input.userId
    }
  });
}

/**
 * Logs a directory search without blocking the response.
 *
 * Returns immediately: analytics must never slow down or fail a visitor's
 * search. Callers should only invoke this for an actual search — a query
 * and/or a category — so counts are not inflated by plain browsing.
 *
 * @param input - What was searched, how many results, and by whom.
 * @returns Nothing; the write happens in the background.
 */
export function recordSearchEvent(input: RecordSearchEventInput): void {
  if (!input.query && !input.category) {
    return;
  }

  try {
    void persistSearchEvent(input).catch((error: unknown) => {
      console.error("Failed to persist search event", {
        error: error instanceof Error ? error.message : "unknown_error"
      });
    });
  } catch (error) {
    console.error("Failed to schedule search event", {
      error: error instanceof Error ? error.message : "unknown_error"
    });
  }
}
