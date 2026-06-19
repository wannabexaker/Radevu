import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  getManagedBusinessForUser,
  type ManagedBusiness
} from "@/lib/business-access";

export type BusinessWithOwner = ManagedBusiness;

/**
 * Reads the current better-auth session and returns its owned or managed business.
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

    return await getManagedBusinessForUser(session.user.id);
  } catch (error) {
    console.error("Failed to load owner business from session", {
      error
    });
    throw error;
  }
}
