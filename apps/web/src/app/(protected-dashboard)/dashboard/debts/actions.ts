"use server";

import { revalidatePath } from "next/cache";
import { getAppointment, updateAppointmentPaid } from "@/lib/appointments";
import { getOwnerBusiness } from "@/lib/dashboard-server";

/**
 * Marks an owner-owned unpaid booking as paid and refreshes dashboard pages.
 *
 * @param appointmentId - Appointment id selected from the debts tab.
 * @returns Resolves when the mutation and revalidation are complete.
 * @throws Error when ownership validation or the paid update fails.
 */
export async function markDebtPaid(appointmentId: string): Promise<void> {
  try {
    const business = await getOwnerBusiness();

    if (!business) {
      throw new Error("Owner business was not found for debt action.");
    }

    const appointment = await getAppointment(business.id, appointmentId);

    if (!appointment) {
      throw new Error("Debt appointment was not found for this owner business.");
    }

    await updateAppointmentPaid(appointmentId, true);
    revalidatePath("/dashboard/debts");
    revalidatePath("/dashboard/today");
    revalidatePath("/dashboard/appointments");
    revalidatePath("/dashboard/customers");
    revalidatePath(`/dashboard/customers/${appointment.customerId}`);
  } catch (error) {
    console.error("Failed to mark debt paid from dashboard", {
      appointmentId,
      error
    });
    throw error;
  }
}
