"use server";

import { AppointmentMessageAuthorRole } from "@radevu/db";
import { revalidatePath } from "next/cache";
import {
  createAppointmentMessage,
  getAppointment,
  updateAppointmentNotes,
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

function normalizeOptionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
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

/**
 * Saves the owner-private note for one owner-owned appointment.
 *
 * @param appointmentId - Appointment id selected from the dashboard.
 * @param notes - Owner-private notes value.
 * @returns Resolves when the note and revalidation are complete.
 */
export async function saveAppointmentPrivateNotes(
  appointmentId: string,
  notes: string
): Promise<void> {
  try {
    await loadOwnedAppointment(appointmentId);

    if (notes.length > 500) {
      throw new Error("Appointment private notes exceed 500 characters.");
    }

    await updateAppointmentNotes(appointmentId, normalizeOptionalText(notes));
    revalidateDashboardAppointments();
  } catch (error) {
    console.error("Failed to save appointment private notes from dashboard", {
      appointmentId,
      error
    });
    throw error;
  }
}

/**
 * Posts an owner-authored shared message on one owner-owned appointment.
 *
 * @param appointmentId - Appointment id selected from the dashboard.
 * @param body - Message body visible to the customer through the secure link.
 * @returns Resolves when the message and revalidation are complete.
 */
export async function postAppointmentOwnerMessage(
  appointmentId: string,
  body: string
): Promise<void> {
  try {
    const appointment = await loadOwnedAppointment(appointmentId);
    const normalized = normalizeOptionalText(body);

    if (!normalized) {
      throw new Error("Appointment message body is required.");
    }

    if (normalized.length > 1000) {
      throw new Error("Appointment message exceeds 1000 characters.");
    }

    await createAppointmentMessage(
      appointment.businessId,
      appointmentId,
      AppointmentMessageAuthorRole.business,
      normalized
    );
    revalidateDashboardAppointments();
  } catch (error) {
    console.error("Failed to post appointment owner message from dashboard", {
      appointmentId,
      error
    });
    throw error;
  }
}
