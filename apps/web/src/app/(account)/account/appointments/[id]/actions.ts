"use server";

import { AppointmentMessageAuthorRole } from "@radevu/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function requireCustomerAppointment(appointmentId: string): Promise<{
  businessId: string;
  id: string;
}> {
  const user = await getCurrentUser();

  if (!user || user.userType !== "customer") {
    throw new Error("Customer session required.");
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      customer: {
        userId: user.id
      },
      id: appointmentId
    },
    select: {
      businessId: true,
      id: true
    }
  });

  if (!appointment) {
    throw new Error("Appointment not found.");
  }

  return appointment;
}

function redirectBack(appointmentId: string, saved: "message" | "note"): never {
  redirect(`/account/appointments/${appointmentId}?saved=${saved}`);
}

export async function saveAccountCustomerPrivateNote(
  formData: FormData
): Promise<void> {
  const appointmentId = formString(formData, "appointment_id");
  const note = formString(formData, "customer_private_note").trim();

  if (note.length > 500) {
    throw new Error("Customer private note exceeds 500 characters.");
  }

  await requireCustomerAppointment(appointmentId);
  await prisma.appointment.update({
    data: {
      customerPrivateNote: note.length > 0 ? note : null
    },
    where: {
      id: appointmentId
    }
  });
  revalidatePath(`/account/appointments/${appointmentId}`);
  redirectBack(appointmentId, "note");
}

export async function postAccountCustomerMessage(
  formData: FormData
): Promise<void> {
  const appointmentId = formString(formData, "appointment_id");
  const body = formString(formData, "body").trim();
  const appointment = await requireCustomerAppointment(appointmentId);

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
  revalidatePath(`/account/appointments/${appointmentId}`);
  redirectBack(appointmentId, "message");
}
