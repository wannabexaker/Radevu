"use server";

import { AppointmentMessageAuthorRole } from "@radevu/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAppointmentGuestTokenValid } from "@/lib/appointment-access";
import { prisma } from "@/lib/db";

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function loadGuestAppointment(appointmentId: string, token: string) {
  const appointment = await prisma.appointment.findUnique({
    where: {
      id: appointmentId
    },
    select: {
      businessId: true,
      guestTokenExpiresAt: true,
      guestTokenHash: true,
      id: true
    }
  });

  if (
    !appointment ||
    !isAppointmentGuestTokenValid(
      token,
      appointment.guestTokenHash,
      appointment.guestTokenExpiresAt
    )
  ) {
    throw new Error("Invalid appointment guest token.");
  }

  return appointment;
}

function redirectToAppointment(
  appointmentId: string,
  token: string,
  saved: "message" | "note"
): never {
  const params = new URLSearchParams({
    token,
    saved
  });

  redirect(`/appointments/${appointmentId}?${params.toString()}`);
}

/**
 * Saves the customer's private note for the secure appointment page.
 *
 * @param formData - Appointment id, guest token, and note fields.
 * @returns Redirects back to the appointment page.
 */
export async function saveCustomerPrivateNote(
  formData: FormData
): Promise<void> {
  const appointmentId = formString(formData, "appointment_id");
  const token = formString(formData, "token");
  const note = formString(formData, "customer_private_note").trim();

  if (note.length > 500) {
    throw new Error("Customer private note exceeds 500 characters.");
  }

  await loadGuestAppointment(appointmentId, token);
  await prisma.appointment.update({
    data: {
      customerPrivateNote: note.length > 0 ? note : null
    },
    where: {
      id: appointmentId
    }
  });
  revalidatePath(`/appointments/${appointmentId}`);
  redirectToAppointment(appointmentId, token, "note");
}

/**
 * Posts a customer-authored shared message on the secure appointment page.
 *
 * @param formData - Appointment id, guest token, and message body.
 * @returns Redirects back to the appointment page.
 */
export async function postCustomerAppointmentMessage(
  formData: FormData
): Promise<void> {
  const appointmentId = formString(formData, "appointment_id");
  const token = formString(formData, "token");
  const body = formString(formData, "body").trim();
  const appointment = await loadGuestAppointment(appointmentId, token);

  if (!body) {
    throw new Error("Appointment message body is required.");
  }

  if (body.length > 1000) {
    throw new Error("Appointment message exceeds 1000 characters.");
  }

  await prisma.appointmentMessage.create({
    data: {
      appointmentId,
      authorRole: AppointmentMessageAuthorRole.customer,
      body,
      businessId: appointment.businessId
    }
  });
  revalidatePath(`/appointments/${appointmentId}`);
  redirectToAppointment(appointmentId, token, "message");
}
