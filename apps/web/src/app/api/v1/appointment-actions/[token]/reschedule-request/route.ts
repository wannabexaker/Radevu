import { NextResponse, type NextRequest } from "next/server";
import { notifyOwnerReschedule } from "@/lib/appointment-action-emails";
import { generateSlots } from "@/lib/availability";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ token: string }> };

function localDate(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", { day: "2-digit", month: "2-digit", timeZone: timezone, year: "numeric" }).formatToParts(date);
  const part = (type: string): string => parts.find((item) => item.type === type)?.value ?? "00";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export async function POST(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { token } = await context.params;
  const body: unknown = await request.json().catch(() => null);
  const value = typeof body === "object" && body !== null ? (body as { starts_at?: unknown }).starts_at : null;
  const requestedStart = typeof value === "string" ? new Date(value) : new Date(Number.NaN);
  if (Number.isNaN(requestedStart.getTime())) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Διάλεξε έγκυρη νέα ώρα." } }, { status: 400 });
  }

  const appointment = await prisma.appointment.findUnique({
    where: { actionToken: token },
    include: {
      business: { select: { contactEmail: true, id: true, name: true, owner: { select: { email: true } }, timezone: true, workingHours: true } },
      customer: { select: { email: true, name: true } },
      service: { select: { active: true, businessId: true, durationMinutes: true, id: true, name: true } }
    }
  });
  if (!appointment) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Το ραντεβού δεν βρέθηκε." } }, { status: 404 });
  }
  if (appointment.status !== "scheduled") {
    return NextResponse.json({ error: { code: "INVALID_STATUS", message: "Το ραντεβού δεν μπορεί πλέον να αλλάξει." } }, { status: 409 });
  }

  const existingAppointments = await prisma.appointment.findMany({
    where: { businessId: appointment.businessId, id: { not: appointment.id }, status: "scheduled" },
    select: { endsAt: true, startsAt: true }
  });
  const available = generateSlots(appointment.business, appointment.service, localDate(requestedStart, appointment.business.timezone), existingAppointments)
    .some((slot) => slot.startsAt.getTime() === requestedStart.getTime());
  if (!available) {
    return NextResponse.json({ error: { code: "SLOT_TAKEN", message: "Η ώρα δεν είναι πλέον διαθέσιμη." } }, { status: 409 });
  }

  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { rescheduleRequestedAt: new Date(), rescheduleRequestedStart: requestedStart, rescheduleStatus: "pending" }
  });
  notifyOwnerReschedule({
    business: { contactEmail: appointment.business.contactEmail, name: appointment.business.name, ownerEmail: appointment.business.owner.email, timezone: appointment.business.timezone },
    customer: appointment.customer,
    serviceName: appointment.service.name,
    startsAt: appointment.startsAt
  }, requestedStart);

  return NextResponse.json({ ok: true });
}
