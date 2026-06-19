"use server";

import { revalidatePath } from "next/cache";
import { notifyCustomerRescheduleResult } from "@/lib/appointment-action-emails";
import { generateSlots } from "@/lib/availability";
import { getOwnerBusiness } from "@/lib/dashboard-server";
import { prisma } from "@/lib/db";

function localDate(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", { day: "2-digit", month: "2-digit", timeZone: timezone, year: "numeric" }).formatToParts(date);
  const part = (type: string): string => parts.find((item) => item.type === type)?.value ?? "00";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

async function loadPending(appointmentId: string) {
  const business = await getOwnerBusiness();
  if (!business) throw new Error("FORBIDDEN");

  const appointment = await prisma.appointment.findFirst({
    where: { businessId: business.id, id: appointmentId, rescheduleStatus: "pending" },
    include: {
      business: { select: { contactEmail: true, id: true, name: true, owner: { select: { email: true } }, timezone: true, workingHours: true } },
      customer: { select: { email: true, name: true } },
      service: { select: { active: true, businessId: true, durationMinutes: true, id: true, name: true } }
    }
  });
  if (!appointment || !appointment.rescheduleRequestedStart) throw new Error("NOT_FOUND");
  return appointment;
}

function emailContext(appointment: Awaited<ReturnType<typeof loadPending>>, startsAt: Date) {
  return {
    business: {
      contactEmail: appointment.business.contactEmail,
      name: appointment.business.name,
      ownerEmail: appointment.business.owner.email,
      timezone: appointment.business.timezone
    },
    customer: appointment.customer,
    serviceName: appointment.service.name,
    startsAt
  };
}

export async function approveReschedule(appointmentId: string): Promise<void> {
  const appointment = await loadPending(appointmentId);
  const requestedStart = appointment.rescheduleRequestedStart;
  if (!requestedStart) throw new Error("NOT_FOUND");
  const slotLockKey = `${appointment.serviceId}:${requestedStart.toISOString()}`;

  const approved = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${appointment.businessId}), hashtext(${slotLockKey}))`;
    const current = await tx.appointment.findUnique({ where: { id: appointment.id }, select: { rescheduleRequestedStart: true, rescheduleStatus: true, status: true } });
    if (!current || current.rescheduleStatus !== "pending" || current.status !== "scheduled" || current.rescheduleRequestedStart?.getTime() !== requestedStart.getTime()) return false;

    const existing = await tx.appointment.findMany({
      where: { businessId: appointment.businessId, id: { not: appointment.id }, status: "scheduled" },
      select: { endsAt: true, startsAt: true }
    });
    const slot = generateSlots(appointment.business, appointment.service, localDate(requestedStart, appointment.business.timezone), existing)
      .find((candidate) => candidate.startsAt.getTime() === requestedStart.getTime());
    if (!slot) return false;

    await tx.appointment.update({
      where: { id: appointment.id },
      data: { endsAt: slot.endsAt, rescheduleStatus: "approved", startsAt: slot.startsAt, status: "scheduled" }
    });
    return true;
  });

  if (!approved) throw new Error("SLOT_TAKEN");
  notifyCustomerRescheduleResult(emailContext(appointment, requestedStart), true);
  revalidatePath("/dashboard/appointments");
}

export async function rejectReschedule(appointmentId: string): Promise<void> {
  const appointment = await loadPending(appointmentId);
  const updated = await prisma.appointment.updateMany({
    where: { id: appointment.id, rescheduleStatus: "pending" },
    data: { rescheduleStatus: "rejected" }
  });
  if (updated.count !== 1) throw new Error("REQUEST_ALREADY_HANDLED");
  notifyCustomerRescheduleResult(emailContext(appointment, appointment.startsAt), false);
  revalidatePath("/dashboard/appointments");
}
