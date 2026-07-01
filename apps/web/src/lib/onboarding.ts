import { prisma } from "@/lib/db";

export type OnboardingStep = {
  done: boolean;
  href: string;
  label: string;
};

function hasOpenHours(workingHours: unknown): boolean {
  if (!workingHours || typeof workingHours !== "object") {
    return false;
  }

  return Object.values(workingHours as Record<string, unknown>).some(
    (day) => Array.isArray(day) && day.length > 0
  );
}

/**
 * Computes the owner onboarding checklist state for a business.
 *
 * @param businessId - Business id to evaluate.
 * @returns The ordered onboarding steps with completion state.
 */
export async function getOnboardingSteps(
  businessId: string
): Promise<OnboardingStep[]> {
  const business = await prisma.business.findUnique({
    select: {
      category: true,
      description: true,
      photoUrl: true,
      services: {
        select: { id: true },
        take: 1,
        where: { active: true }
      },
      showOnLanding: true,
      workingHours: true
    },
    where: { id: businessId }
  });

  if (!business) {
    return [];
  }

  return [
    {
      done: Boolean(business.category),
      href: "/dashboard/settings/profile",
      label: "Διάλεξε κατηγορία"
    },
    {
      done: hasOpenHours(business.workingHours),
      href: "/dashboard/settings/hours",
      label: "Όρισε ωράριο λειτουργίας"
    },
    {
      done: business.services.length > 0,
      href: "/dashboard/settings/services",
      label: "Πρόσθεσε μια υπηρεσία"
    },
    {
      done: Boolean(business.photoUrl) && Boolean(business.description),
      href: "/dashboard/settings/profile",
      label: "Βάλε φωτογραφία & περιγραφή"
    },
    {
      done: business.showOnLanding,
      href: "/dashboard/settings/visibility",
      label: "Εμφάνιση στην αρχική σελίδα"
    }
  ];
}
