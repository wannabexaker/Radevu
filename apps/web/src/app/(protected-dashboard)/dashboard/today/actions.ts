"use server";

import { revalidatePath } from "next/cache";
import {
  getAppointment,
  updateAppointmentPaid,
  updateAppointmentStatus
} from "@/lib/appointments";
import { getOwnerBusiness } from "@/lib/dashboard-server";

async function loadOwnedAppointment(appointmentId: string) {
  const business = await getOwnerBusiness();

  if (!business) {
    throw new Error("Owner business was not found for appointment action.");
  }

  const appointment = await getAppointment(business.id, appointmentId);

  if (!appointment) {
    throw new Error("Appointment was not found for this owner business.");
  }

  return appointment;
}

function revalidateDashboardAppointments(): void {
  revalidatePath("/dashboard/today");
  revalidatePath("/dashboard/appointments");
}

/**
 * Marks an owner-owned scheduled appointment as done and refreshes dashboard pages.
 *
 * @param appointmentId - Appointment id selected from the dashboard.
 * @returns Resolves when the mutation and revalidation are complete.
 * @throws Error when ownership validation or the status transition fails.
 */
export async function markAppointmentDone(appointmentId: string): Promise<void> {
  try {
    await loadOwnedAppointment(appointmentId);
    await updateAppointmentStatus(appointmentId, "done");
    revalidateDashboardAppointments();
  } catch (error) {
    console.error("Failed to mark appointment done from dashboard", {
      appointmentId,
      error
    });
    throw error;
  }
}

/**
 * Cancels an owner-owned scheduled appointment and refreshes dashboard pages.
 *
 * @param appointmentId - Appointment id selected from the dashboard.
 * @returns Resolves when the mutation and revalidation are complete.
 * @throws Error when ownership validation or the status transition fails.
 */
export async function cancelAppointment(appointmentId: string): Promise<void> {
  try {
    await loadOwnedAppointment(appointmentId);
    await updateAppointmentStatus(appointmentId, "cancelled");
    revalidateDashboardAppointments();
  } catch (error) {
    console.error("Failed to cancel appointment from dashboard", {
      appointmentId,
      error
    });
    throw error;
  }
}

/**
 * Toggles the paid flag for an owner-owned appointment and refreshes dashboard pages.
 *
 * @param appointmentId - Appointment id selected from the dashboard.
 * @returns Resolves when the mutation and revalidation are complete.
 * @throws Error when ownership validation or the paid update fails.
 */
export async function togglePaid(appointmentId: string): Promise<void> {
  try {
    const appointment = await loadOwnedAppointment(appointmentId);
    await updateAppointmentPaid(appointmentId, !appointment.paid);
    revalidateDashboardAppointments();
  } catch (error) {
    console.error("Failed to toggle appointment paid state from dashboard", {
      appointmentId,
      error
    });
    throw error;
  }
}
