import type { Prisma } from "@radevu/db";
import { prisma } from "@/lib/db";

const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 24;
const HISTORY_LOOKBACK = 20;

export type RecommendedBusiness = {
  category: string | null;
  description: string | null;
  id: string;
  logoUrl: string | null;
  name: string;
  photoUrl: string | null;
  slug: string;
};

export type RecommendationReason = "history" | "random";

export type RecommendationResult = {
  items: RecommendedBusiness[];
  reason: RecommendationReason;
};

const recommendedSelect = {
  category: true,
  description: true,
  id: true,
  logoUrl: true,
  name: true,
  photoUrl: true,
  slug: true
} satisfies Prisma.BusinessSelect;

/** A business is only worth recommending if it can actually be booked. */
const completeWhere: Prisma.BusinessWhereInput = {
  category: { not: null },
  services: { some: { active: true } }
};

/**
 * Only businesses that are actually usable get recommended: they must be
 * published to the landing page, have a category, and have something bookable.
 */
const featuredWhere: Prisma.BusinessWhereInput = {
  ...completeWhere,
  showOnLanding: true
};

/**
 * Returns a shuffled copy of the list.
 *
 * Fisher-Yates, so every ordering is equally likely — a `sort(() => ...)`
 * shuffle is biased and would keep showing the same businesses first.
 *
 * @param items - Items to shuffle.
 * @returns A new array in random order.
 */
function shuffled<T>(items: T[]): T[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(Math.random() * (index + 1));
    const current = copy[index];
    const other = copy[swapWith];

    if (current !== undefined && other !== undefined) {
      copy[index] = other;
      copy[swapWith] = current;
    }
  }

  return copy;
}

function clampLimit(limit: number | undefined): number {
  if (!limit || !Number.isInteger(limit)) {
    return DEFAULT_LIMIT;
  }

  return Math.min(Math.max(limit, 1), MAX_LIMIT);
}

/**
 * Picks businesses to show as "Προτεινόμενα".
 *
 * Visitors without a session get a fresh random rotation, so the same few
 * businesses do not monopolise the landing page. Signed-in customers with
 * booking history get the businesses they have used, then others in the same
 * categories, then random featured ones to fill the row.
 *
 * @param input - Optional user id and how many to return.
 * @returns The chosen businesses and whether history influenced the result.
 */
export async function getRecommendedBusinesses(input: {
  limit?: number;
  userId?: string | null;
}): Promise<RecommendationResult> {
  const limit = clampLimit(input.limit);
  const featured = await prisma.business.findMany({
    select: recommendedSelect,
    where: featuredWhere
  });

  if (!input.userId) {
    return {
      items: shuffled(featured).slice(0, limit),
      reason: "random"
    };
  }

  const history = await prisma.appointment.findMany({
    distinct: ["businessId"],
    orderBy: { startsAt: "desc" },
    select: { business: { select: recommendedSelect } },
    take: HISTORY_LOOKBACK,
    where: {
      // A business the user booked before may since have gone incomplete;
      // recommending it would render a card that cannot be booked.
      business: completeWhere,
      customer: { userId: input.userId }
    }
  });

  if (history.length === 0) {
    return {
      items: shuffled(featured).slice(0, limit),
      reason: "random"
    };
  }

  const booked = history.map((appointment) => appointment.business);
  const bookedIds = new Set(booked.map((business) => business.id));
  const bookedCategories = new Set(
    booked
      .map((business) => business.category)
      .filter((category): category is string => Boolean(category))
  );

  const sameCategory = shuffled(
    featured.filter(
      (business) =>
        !bookedIds.has(business.id) &&
        business.category !== null &&
        bookedCategories.has(business.category)
    )
  );
  const rest = shuffled(
    featured.filter(
      (business) =>
        !bookedIds.has(business.id) &&
        !(business.category !== null && bookedCategories.has(business.category))
    )
  );

  const ordered: RecommendedBusiness[] = [];
  const seen = new Set<string>();

  for (const business of [...booked, ...sameCategory, ...rest]) {
    if (seen.has(business.id) || ordered.length >= limit) {
      continue;
    }

    seen.add(business.id);
    ordered.push(business);
  }

  return {
    items: ordered,
    reason: "history"
  };
}
