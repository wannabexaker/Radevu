"use server";

import {
  BUSINESS_CATEGORIES,
  BUSINESS_SLUG_MAX_LENGTH,
  BUSINESS_SLUG_REGEX,
  RESERVED_DEMO_SLUGS,
  RESERVED_SLUGS
} from "@radevu/shared";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getManagedBusinessForUser } from "@/lib/business-access";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

export type CreateBusinessResult = {
  error: string;
  ok: false;
};

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Lets an existing signed-in user create their business profile and become an
 * owner while keeping their customer side. One business per user.
 *
 * @param formData - Fields: business_name, slug, category.
 * @returns A typed error result; on success it redirects to the dashboard.
 */
export async function createBusinessAction(
  formData: FormData
): Promise<CreateBusinessResult> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (await getManagedBusinessForUser(user.id)) {
    redirect("/dashboard/today");
  }

  const name = String(formData.get("business_name") ?? "").trim();
  const slug = normalizeSlug(String(formData.get("slug") ?? ""));
  const category = String(formData.get("category") ?? "").trim();

  if (name.length < 2) {
    return {
      error: "Δώσε όνομα επιχείρησης (τουλάχιστον 2 χαρακτήρες).",
      ok: false
    };
  }

  if (
    !slug ||
    slug.length > BUSINESS_SLUG_MAX_LENGTH ||
    !BUSINESS_SLUG_REGEX.test(slug)
  ) {
    return {
      error: "Ο σύνδεσμος να έχει μόνο λατινικά, αριθμούς και παύλες.",
      ok: false
    };
  }

  if (RESERVED_SLUGS.has(slug) || RESERVED_DEMO_SLUGS.has(slug)) {
    return {
      error: "Αυτός ο σύνδεσμος είναι δεσμευμένος. Δοκίμασε έναν άλλον.",
      ok: false
    };
  }

  if (!(BUSINESS_CATEGORIES as readonly string[]).includes(category)) {
    return {
      error: "Διάλεξε κατηγορία.",
      ok: false
    };
  }

  const slugTaken = await prisma.business.findUnique({
    select: { id: true },
    where: { slug }
  });

  if (slugTaken) {
    return {
      error: "Αυτός ο σύνδεσμος χρησιμοποιείται ήδη.",
      ok: false
    };
  }

  try {
    await prisma.$transaction([
      prisma.business.create({
        data: {
          category,
          contactEmail: user.email,
          contactPhone: user.phone ?? null,
          name,
          ownerId: user.id,
          slug
        }
      }),
      prisma.user.update({
        data: { userType: "business_owner" },
        where: { id: user.id }
      })
    ]);
  } catch (error) {
    console.error("Failed to create business for user", {
      error,
      userId: user.id
    });
    return {
      error: "Δεν μπορέσαμε να δημιουργήσουμε την επιχείρηση. Δοκίμασε ξανά.",
      ok: false
    };
  }

  revalidatePath("/");
  revalidatePath("/epaggelmaties");
  redirect("/dashboard/today");
}
