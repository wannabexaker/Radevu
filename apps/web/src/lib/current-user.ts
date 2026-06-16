import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type CurrentUser = {
  email: string;
  emailVerified: boolean;
  id: string;
  marketingOptIn: boolean;
  name: string | null;
  phone: string | null;
  userType: "business_owner" | "customer";
};

export async function getCurrentUser(
  requestHeaders?: Headers
): Promise<CurrentUser | null> {
  const session = await auth.api.getSession({
    headers: requestHeaders ?? (await headers())
  });

  if (!session) {
    return null;
  }

  return prisma.user.findUnique({
    where: {
      id: session.user.id
    },
    select: {
      email: true,
      emailVerified: true,
      id: true,
      marketingOptIn: true,
      name: true,
      phone: true,
      userType: true
    }
  });
}
