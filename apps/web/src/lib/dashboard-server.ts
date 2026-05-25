import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type BusinessWithOwner = {
  id: string;
  name: string;
  ownerId: string;
  timezone: string;
  owner: {
    email: string | null;
    id: string;
  };
};

/**
 * Reads the current better-auth session and returns the business owned by it.
 *
 * @returns The owner's business with owner summary, or null when no owner business exists.
 * @throws Error when better-auth session lookup or Prisma lookup fails.
 */
export async function getOwnerBusiness(): Promise<BusinessWithOwner | null> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return null;
    }

    return await prisma.business.findUnique({
      where: {
        ownerId: session.user.id
      },
      select: {
        id: true,
        name: true,
        ownerId: true,
        timezone: true,
        owner: {
          select: {
            email: true,
            id: true
          }
        }
      }
    });
  } catch (error) {
    console.error("Failed to load owner business from session", {
      error
    });
    throw error;
  }
}
