import { prisma } from "@/lib/db";

export type ManagedBusiness = {
  id: string;
  name: string;
  ownerId: string;
  slug: string;
  timezone: string;
  owner: {
    email: string | null;
    id: string;
  };
};

/** Returns whether a user is the primary owner or a linked manager. */
export async function canManageBusiness(
  userId: string,
  businessId: string
): Promise<boolean> {
  const business = await prisma.business.findFirst({
    where: {
      id: businessId,
      OR: [
        { ownerId: userId },
        { managers: { some: { userId } } }
      ]
    },
    select: { id: true }
  });

  return Boolean(business);
}

/** Returns the user's primary business first, then a managed business. */
export async function getManagedBusinessForUser(
  userId: string
): Promise<ManagedBusiness | null> {
  const select = {
    id: true,
    name: true,
    ownerId: true,
    slug: true,
    timezone: true,
    owner: { select: { email: true, id: true } }
  } as const;
  const owned = await prisma.business.findUnique({
    where: { ownerId: userId },
    select
  });

  if (owned) {
    return owned;
  }

  return prisma.business.findFirst({
    where: { managers: { some: { userId } } },
    orderBy: { createdAt: "asc" },
    select
  });
}

/** Returns whether the user is the immutable primary owner. */
export async function isPrimaryBusinessOwner(
  userId: string,
  businessId: string
): Promise<boolean> {
  const business = await prisma.business.findFirst({
    where: { id: businessId, ownerId: userId },
    select: { id: true }
  });

  return Boolean(business);
}
