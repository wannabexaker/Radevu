import { NextResponse, type NextRequest } from "next/server";
import { notifyOwnerCancellation } from "@/lib/appointment-action-emails";
import { prisma } from "@/lib/db";
import { cancelReminder } from "@/lib/reminder-queue";

type RouteContext = { params: Promise<{ token: string }> };

export async function POST(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { token } = await context.params;
  const body: unknown = await request.json().catch(() => null);
  const reason = typeof body === "object" && body !== null &&
    typeof (body as { reason?: unknown }).reason === "string"
      ? (body as { reason: string }).reason.trim()
      : "";

  if (reason.length < 3 || reason.length > 500) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Ο λόγος ακύρωσης είναι υποχρεωτικός (3-500 χαρακτήρες)." } }, { status: 400 });
  }

  const appointment = await prisma.appointment.findUnique({
    where: { actionToken: token },
    include: {
      business: { select: { contactEmail: true, name: true, owner: { select: { email: true } }, timezone: true } },
      customer: { select: { email: true, name: true } },
      service: { select: { name: true } }
    }
  });

  if (!appointment) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Το ραντεβού δεν βρέθηκε." } }, { status: 404 });
  }
  if (appointment.status !== "scheduled") {
    return NextResponse.json({ error: { code: "INVALID_STATUS", message: "Το ραντεβού δεν μπορεί πλέον να ακυρωθεί." } }, { status: 409 });
  }

  const updated = await prisma.appointment.updateMany({
    where: { id: appointment.id, status: "scheduled" },
    data: { cancellationReason: reason, status: "cancelled" }
  });
  if (updated.count !== 1) {
    return NextResponse.json({ error: { code: "INVALID_STATUS", message: "Το ραντεβού έχει ήδη αλλάξει." } }, { status: 409 });
  }

  void cancelReminder(appointment.id).catch((error) => console.error("Failed to cancel reminder", { appointmentId: appointment.id, error }));
  notifyOwnerCancellation({
    business: { contactEmail: appointment.business.contactEmail, name: appointment.business.name, ownerEmail: appointment.business.owner.email, timezone: appointment.business.timezone },
    customer: appointment.customer,
    serviceName: appointment.service.name,
    startsAt: appointment.startsAt
  }, reason);

  return NextResponse.json({ ok: true });
}
