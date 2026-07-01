import { BUSINESS_CATEGORIES, type BusinessCategory } from "@radevu/shared";
import type { Prisma } from "@radevu/db";
import { prisma } from "@/lib/db";

const DEFAULT_TAKE = 24;
const MAX_TAKE = 50;
const MAX_SEARCH_LENGTH = 80;

export type DirectoryBusiness = {
  category: string | null;
  description: string | null;
  id: string;
  logoUrl: string | null;
  name: string;
  photoUrl: string | null;
  slug: string;
};

export type DirectoryBusinessResult = {
  items: DirectoryBusiness[];
  nextCursor: string | null;
};

export type DirectoryBusinessQuery = {
  category?: string;
  cursor?: string;
  search?: string;
  take?: number;
};

export function normalizeDirectoryCategory(
  category: string | null | undefined
): BusinessCategory | null {
  const value = category?.trim();

  if (!value) {
    return null;
  }

  return BUSINESS_CATEGORIES.includes(value as BusinessCategory)
    ? (value as BusinessCategory)
    : null;
}

export function normalizeDirectorySearch(
  search: string | null | undefined
): string | null {
  const value = search?.trim();

  if (!value) {
    return null;
  }

  return value.slice(0, MAX_SEARCH_LENGTH);
}

export function normalizeDirectoryTake(take: number | null | undefined): number {
  if (!take || !Number.isInteger(take)) {
    return DEFAULT_TAKE;
  }

  return Math.min(Math.max(take, 1), MAX_TAKE);
}

function buildDirectoryWhere(
  input: DirectoryBusinessQuery
): Prisma.BusinessWhereInput {
  const category = normalizeDirectoryCategory(input.category);
  const search = normalizeDirectorySearch(input.search);
  const filters: Prisma.BusinessWhereInput[] = [
    {
      category: {
        not: null
      }
    },
    {
      services: {
        some: {
          active: true
        }
      }
    }
  ];

  if (category) {
    filters.push({
      category
    });
  }

  if (search) {
    filters.push({
      OR: [
        {
          name: {
            contains: search,
            mode: "insensitive"
          }
        },
        {
          description: {
            contains: search,
            mode: "insensitive"
          }
        }
      ]
    });
  }

  return {
    AND: filters
  };
}

export async function listDirectoryBusinesses(
  input: DirectoryBusinessQuery = {}
): Promise<DirectoryBusinessResult> {
  const take = normalizeDirectoryTake(input.take);
  const businesses = await prisma.business.findMany({
    cursor: input.cursor
      ? {
          id: input.cursor
        }
      : undefined,
    orderBy: [
      {
        name: "asc"
      },
      {
        id: "asc"
      }
    ],
    select: {
      category: true,
      description: true,
      id: true,
      logoUrl: true,
      name: true,
      photoUrl: true,
      slug: true
    },
    skip: input.cursor ? 1 : 0,
    take: take + 1,
    where: buildDirectoryWhere(input)
  });
  const items = businesses.slice(0, take);

  return {
    items,
    nextCursor: businesses.length > take ? items.at(-1)?.id ?? null : null
  };
}
