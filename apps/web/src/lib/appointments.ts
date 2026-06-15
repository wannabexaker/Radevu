import type {
  AppointmentStatusDTO,
  AppointmentWithRelationsDTO
} from "@radevu/shared";
import {
  AppointmentMessageAuthorRole,
  AppointmentStatus,
  type Prisma
} from "@radevu/db";
import { prisma } from "@/lib/db";

const DEFAULT_TAKE = 50;

const appointmentInclude = {
  customer: {
    select: {
      email: true,
      id: true,
      name: true,
      phone: true
    }
  },
  service: {
    select: {
      currency: true,
      durationMinutes: true,
      id: true,
      name: true,
      priceCents: true
    }
  },
  messages: {
    orderBy: {
      createdAt: "asc"
    },
    select: {
      authorRole: true,
      body: true,
      createdAt: true,
      id: true
    }
  }
} satisfies Prisma.AppointmentInclude;

export type AppointmentWithRelations = Prisma.AppointmentGetPayload<{
  include: typeof appointmentInclude;
}>;

type DateParts = {
  day: number;
  month: number;
  year: number;
};

type ListAppointmentsInput = {
  cursor?: string;
  customerQuery?: string;
  from: Date;
  status?: AppointmentStatusDTO[];
  take?: number;
  to: Date;
};

function datePartsInTimeZone(date: Date, timezone: string): DateParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric"
  }).formatToParts(date);

  const getPart = (type: string): number => {
    const value = parts.find((part) => part.type === type)?.value;
    return value ? Number(value) : 0;
  };

  return {
    day: getPart("day"),
    month: getPart("month"),
    year: getPart("year")
  };
}

function isoDateFromParts(parts: DateParts): string {
  return `${parts.year.toString().padStart(4, "0")}-${parts.month
    .toString()
    .padStart(2, "0")}-${parts.day.toString().padStart(2, "0")}`;
}

function timeZoneOffsetMs(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone: timezone,
    year: "numeric"
  }).formatToParts(date);

  const getPart = (type: string): number => {
    const value = parts.find((part) => part.type === type)?.value;
    return value ? Number(value) : 0;
  };

  const asUtc = Date.UTC(
    getPart("year"),
    getPart("month") - 1,
    getPart("day"),
    getPart("hour"),
    getPart("minute"),
    getPart("second")
  );

  return asUtc - date.getTime();
}

function zonedDateTimeToUtc(
  dateISO: string,
  time: string,
  timezone: string
): Date {
  const [year = 0, month = 0, day = 0] = dateISO.split("-").map(Number);
  const [hour = 0, minute = 0] = time.split(":").map(Number);
  const initialUtc = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  const firstOffset = timeZoneOffsetMs(new Date(initialUtc), timezone);
  const firstUtc = initialUtc - firstOffset;
  const secondOffset = timeZoneOffsetMs(new Date(firstUtc), timezone);

  return new Date(initialUtc - secondOffset);
}

function addDays(dateISO: string, days: number): string {
  const [year = 0, month = 0, day = 0] = dateISO.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0, 0));
  return next.toISOString().slice(0, 10);
}

function localDayWindow(
  timezone: string,
  days: number
): { from: Date; to: Date } {
  const todayISO = isoDateFromParts(datePartsInTimeZone(new Date(), timezone));
  const endISO = addDays(todayISO, days);

  return {
    from: zonedDateTimeToUtc(todayISO, "00:00", timezone),
    to: zonedDateTimeToUtc(endISO, "00:00", timezone)
  };
}

function todayWindow(timezone: string): { from: Date; to: Date } {
  return localDayWindow(timezone, 1);
}

function toPrismaStatus(status: AppointmentStatusDTO): AppointmentStatus {
  return AppointmentStatus[status];
}

function assertAllowedTransition(
  current: AppointmentStatusDTO,
  next: AppointmentStatusDTO
): void {
  if (current === next) {
    return;
  }

  if (current === "scheduled" && (next === "done" || next === "cancelled")) {
    return;
  }

  throw new InvalidAppointmentTransitionError(current, next);
}

/**
 * Error thrown when an appointment status update violates the allowed transition graph.
 */
export class InvalidAppointmentTransitionError extends Error {
  constructor(current: AppointmentStatusDTO, next: AppointmentStatusDTO) {
    super(`Invalid appointment transition from ${current} to ${next}`);
    this.name = "InvalidAppointmentTransitionError";
  }
}

/**
 * Serializes an appointment relation payload into snake_case JSON.
 *
 * @param appointment - Appointment loaded with customer and service summaries.
 * @returns API-safe appointment DTO with snake_case keys.
 */
export function serializeAppointmentWithRelations(
  appointment: AppointmentWithRelations
): AppointmentWithRelationsDTO {
  return {
    id: appointment.id,
    business_id: appointment.businessId,
    customer_id: appointment.customerId,
    service_id: appointment.serviceId,
    starts_at: appointment.startsAt.toISOString(),
    ends_at: appointment.endsAt.toISOString(),
    status: appointment.status,
    paid: appointment.paid,
    amount_due_cents: appointment.amountDueCents,
    notes: appointment.notes,
    customer_note: appointment.customerNote,
    messages: appointment.messages.map((message) => ({
      id: message.id,
      author_role: message.authorRole,
      body: message.body,
      created_at: message.createdAt.toISOString()
    })),
    customer: {
      id: appointment.customer.id,
      name: appointment.customer.name,
      email: appointment.customer.email,
      phone: appointment.customer.phone
    },
    service: {
      id: appointment.service.id,
      name: appointment.service.name,
      duration_minutes: appointment.service.durationMinutes,
      price_cents: appointment.service.priceCents,
      currency: appointment.service.currency
    }
  };
}

/**
 * Loads all appointments for the owner's business-local current day.
 *
 * SQL equivalent: select appointments for `business_id` where `starts_at >= local midnight`
 * and `starts_at < next local midnight`, ordered by `starts_at asc`, including customer
 * and service relations.
 *
 * @param businessId - Business id used as the tenant boundary.
 * @param timezone - IANA timezone used to compute the business-local day.
 * @returns Today's appointment rows with customer and service summaries.
 * @throws Error when Prisma query fails.
 */
export async function getTodayAppointments(
  businessId: string,
  timezone: string
): Promise<AppointmentWithRelations[]> {
  const { from, to } = todayWindow(timezone);

  return prisma.appointment.findMany({
    include: appointmentInclude,
    orderBy: {
      startsAt: "asc"
    },
    where: {
      businessId,
      startsAt: {
        gte: from,
        lt: to
      }
    }
  });
}

/**
 * Loads appointments from today through a business-local rolling day window.
 *
 * SQL equivalent: select appointments for `business_id` where `starts_at >= local
 * midnight today` and `starts_at < local midnight after N days`, ordered by start time.
 *
 * @param businessId - Business id used as the tenant boundary.
 * @param timezone - IANA timezone used to compute the business-local day window.
 * @param days - Number of business-local days to include, counting today as day 1.
 * @returns Appointment rows with customer and service summaries.
 * @throws Error when Prisma query fails.
 */
export async function getUpcomingDashboardAppointments(
  businessId: string,
  timezone: string,
  days: number
): Promise<AppointmentWithRelations[]> {
  const { from, to } = localDayWindow(timezone, days);

  return prisma.appointment.findMany({
    include: appointmentInclude,
    orderBy: {
      startsAt: "asc"
    },
    where: {
      businessId,
      startsAt: {
        gte: from,
        lt: to
      }
    }
  });
}

/**
 * Lists appointments for one business with date window, status, customer search, and cursor pagination.
 *
 * SQL equivalent: select appointments for `business_id` where `starts_at` is within the
 * requested UTC window, optional `status in (...)`, optional customer name/email/phone
 * `ILIKE`, ordered by `starts_at asc, id asc`, returning `take` items plus next cursor.
 *
 * @param businessId - Business id used as the tenant boundary.
 * @param input - Date window, optional filters, cursor, and page size.
 * @returns Page of appointments and a cursor for the next page when more rows exist.
 * @throws Error when Prisma query fails.
 */
export async function listAppointments(
  businessId: string,
  input: ListAppointmentsInput
): Promise<{ items: AppointmentWithRelations[]; nextCursor: string | null }> {
  const take = input.take ?? DEFAULT_TAKE;
  const rows = await prisma.appointment.findMany({
    cursor: input.cursor ? { id: input.cursor } : undefined,
    include: appointmentInclude,
    orderBy: [
      {
        startsAt: "asc"
      },
      {
        id: "asc"
      }
    ],
    skip: input.cursor ? 1 : 0,
    take: take + 1,
    where: {
      businessId,
      startsAt: {
        gte: input.from,
        lt: input.to
      },
      ...(input.status
        ? {
            status: {
              in: input.status.map(toPrismaStatus)
            }
          }
        : {}),
      ...(input.customerQuery
        ? {
            customer: {
              OR: [
                {
                  name: {
                    contains: input.customerQuery,
                    mode: "insensitive"
                  }
                },
                {
                  email: {
                    contains: input.customerQuery,
                    mode: "insensitive"
                  }
                },
                {
                  phone: {
                    contains: input.customerQuery,
                    mode: "insensitive"
                  }
                }
              ]
            }
          }
        : {})
    }
  });
  const items = rows.slice(0, take);

  return {
    items,
    nextCursor: rows.length > take ? rows[take]?.id ?? null : null
  };
}

/**
 * Loads one appointment by id inside a business tenant boundary.
 *
 * SQL equivalent: select appointment where `business_id = ?` and `id = ?`,
 * including customer and service relations.
 *
 * @param businessId - Business id used as the tenant boundary.
 * @param appointmentId - Appointment id to load.
 * @returns Appointment with relations, or null if it is missing or outside the business.
 * @throws Error when Prisma query fails.
 */
export async function getAppointment(
  businessId: string,
  appointmentId: string
): Promise<AppointmentWithRelations | null> {
  return prisma.appointment.findFirst({
    include: appointmentInclude,
    where: {
      businessId,
      id: appointmentId
    }
  });
}

/**
 * Updates one appointment status after enforcing allowed Phase 1 transitions.
 *
 * SQL equivalent: read current status by appointment id, reject invalid transitions, then
 * update `status` for that appointment. Allowed: scheduled to done, scheduled to cancelled,
 * and idempotent same-status updates.
 *
 * @param appointmentId - Appointment id to mutate.
 * @param status - New status requested by the owner.
 * @returns Resolves when the update is committed.
 * @throws InvalidAppointmentTransitionError when the transition is not allowed.
 * @throws Error when the appointment is missing or Prisma update fails.
 */
export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatusDTO
): Promise<void> {
  const appointment = await prisma.appointment.findUnique({
    where: {
      id: appointmentId
    },
    select: {
      status: true
    }
  });

  if (!appointment) {
    throw new Error("Appointment was not found.");
  }

  assertAllowedTransition(appointment.status, status);

  await prisma.appointment.update({
    data: {
      status: toPrismaStatus(status)
    },
    where: {
      id: appointmentId
    }
  });
}

/**
 * Updates the paid flag on one appointment.
 *
 * SQL equivalent: update `appointments set paid = ? where id = ?`.
 *
 * @param appointmentId - Appointment id to mutate.
 * @param paid - New paid state.
 * @returns Resolves when the update is committed.
 * @throws Error when Prisma update fails.
 */
export async function updateAppointmentPaid(
  appointmentId: string,
  paid: boolean
): Promise<void> {
  await prisma.appointment.update({
    data: {
      paid
    },
    where: {
      id: appointmentId
    }
  });
}

/**
 * Updates the owner-private notes field on one appointment.
 *
 * @param appointmentId - Appointment id to mutate.
 * @param notes - Normalized owner-private notes or null to clear.
 * @returns Resolves when the update is committed.
 */
export async function updateAppointmentNotes(
  appointmentId: string,
  notes: string | null
): Promise<void> {
  await prisma.appointment.update({
    data: {
      notes
    },
    where: {
      id: appointmentId
    }
  });
}

/**
 * Adds one shared appointment message scoped to the owning business.
 *
 * @param businessId - Business id used as the tenant boundary.
 * @param appointmentId - Appointment id receiving the message.
 * @param authorRole - Message author side.
 * @param body - Normalized message body.
 * @returns Resolves when the message is persisted.
 */
export async function createAppointmentMessage(
  businessId: string,
  appointmentId: string,
  authorRole: AppointmentMessageAuthorRole,
  body: string
): Promise<void> {
  await prisma.appointmentMessage.create({
    data: {
      appointmentId,
      authorRole,
      body,
      businessId
    }
  });
}
