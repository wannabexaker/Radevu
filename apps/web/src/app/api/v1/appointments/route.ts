import {
  sendBookingConfirmation,
  sendOwnerNewBookingAlert
} from "@radevu/email";
import {
  createAppointmentSchema,
  defaultNotificationSettings,
  listAppointmentsQuerySchema,
  notificationSettingsSchema,
  type AppointmentDTO,
  type AvailabilityErrorCode,
  type ListAppointmentsResponse,
  type NotificationSettingsDTO
} from "@radevu/shared";
import { NextResponse, type NextRequest } from "next/server";
import {
  listAppointments,
  serializeAppointmentWithRelations
} from "@/lib/appointments";
import { generateSlots } from "@/lib/availability";
import { getOwnerBusiness } from "@/lib/dashboard-server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { enqueueReminder } from "@/lib/reminder-queue";

export const dynamic = "force-dynamic";

type ErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "SLOT_TAKEN"
  | "SERVER_ERROR"
  | Extract<AvailabilityErrorCode, "BEYOND_HORIZON" | "TOO_SOON">;

type ErrorResponse = {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
};

type AppointmentResponse = {
  appointment: AppointmentDTO;
};

type BookingResult =
  | {
      ok: true;
      appointment: AppointmentDTO;
      emailContext: BookingEmailContext;
    }
  | {
      ok: false;
      status: number;
      code: ErrorCode;
      message: string;
      details?: unknown;
    };

type BookingEmailContext = {
  appointment: {
    endsAt: Date;
    id: string;
    notes: string | null;
    startsAt: Date;
  };
  business: {
    contactEmail: string | null;
    contactPhone: string | null;
    mapsUrl: string | null;
    name: string;
    owner: {
      email: string | null;
    };
    timezone: string;
    notificationSettings: NotificationSettingsDTO;
  };
  customer: {
    email: string | null;
    name: string;
    phone: string | null;
  };
  service: {
    currency: string;
    durationMinutes: number;
    name: string;
    priceCents: number;
  };
};

function errorResponse(
  status: number,
  code: ErrorCode,
  message: string,
  details?: unknown
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(details === undefined ? {} : { details })
      }
    },
    { status }
  );
}

function validationDetails(
  issues: Array<{
    path: Array<string | number>;
    message: string;
  }>
): Array<{ path: Array<string | number>; message: string }> {
  return issues.map((issue) => ({
    path: issue.path,
    message: issue.message
  }));
}

function localDateInTimezone(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric"
  }).formatToParts(date);

  const getPart = (type: string): string =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
}

function serializeAppointment(appointment: {
  id: string;
  businessId: string;
  customerId: string;
  serviceId: string;
  startsAt: Date;
  endsAt: Date;
  status: "scheduled" | "done" | "cancelled";
  paid: boolean;
  amountDueCents: number;
  customer: {
    name: string;
  };
  service: {
    currency: string;
    name: string;
  };
}): AppointmentDTO {
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
    currency: appointment.service.currency,
    customer_name: appointment.customer.name,
    service_name: appointment.service.name
  };
}

function emailConfig(): { resendApiKey: string; resendFromEmail: string } | null {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
    return null;
  }

  return {
    resendApiKey: env.RESEND_API_KEY,
    resendFromEmail: env.RESEND_FROM_EMAIL
  };
}

function dashboardAppointmentsUrl(): string {
  return new URL("/dashboard/appointments", env.BETTER_AUTH_URL).toString();
}

function parseNotificationSettings(value: unknown): NotificationSettingsDTO {
  const parsed = notificationSettingsSchema.safeParse(value);

  if (!parsed.success) {
    console.warn("Invalid business notification settings, using default", {
      issues: parsed.error.issues
    });
    return defaultNotificationSettings;
  }

  return parsed.data;
}

function dispatchBookingEmails(context: BookingEmailContext): void {
  const config = emailConfig();

  if (!config) {
    console.error("Booking email dispatch skipped because Resend config is missing", {
      appointment_id: context.appointment.id,
      has_resend_api_key: Boolean(env.RESEND_API_KEY),
      has_resend_from_email: Boolean(env.RESEND_FROM_EMAIL)
    });
    return;
  }

  const jobs: Array<Promise<void>> = [];

  if (
    context.customer.email &&
    context.business.notificationSettings.confirmation_enabled
  ) {
    const recipient = context.customer.email;

    jobs.push(
      (async () => {
        try {
          await sendBookingConfirmation({
            ...config,
            appointment: context.appointment,
            business: context.business,
            customer: context.customer,
            service: context.service,
            timezone: context.business.timezone,
            to: recipient
          });
        } catch (error) {
          console.error("[booking confirmation email failed]", {
            appointment_id: context.appointment.id,
            recipient,
            error
          });
        }
      })()
    );
  } else if (context.customer.email) {
    console.info("Booking confirmation email skipped by business setting", {
      appointment_id: context.appointment.id
    });
  }

  // Resend sandbox only delivers to the signup inbox in Phase 0. CONTACT_NOTIFICATION_EMAIL
  // can route owner alerts there without changing production owner-email behavior later.
  const ownerRecipient =
    env.CONTACT_NOTIFICATION_EMAIL ?? context.business.owner.email;

  if (ownerRecipient) {
    jobs.push(
      (async () => {
        try {
          await sendOwnerNewBookingAlert({
            ...config,
            appointment: context.appointment,
            business: context.business,
            customer: context.customer,
            dashboardUrl: dashboardAppointmentsUrl(),
            service: context.service,
            timezone: context.business.timezone,
            to: ownerRecipient
          });
        } catch (error) {
          console.error("[owner booking alert email failed]", {
            appointment_id: context.appointment.id,
            recipient: ownerRecipient,
            error
          });
        }
      })()
    );
  }

  void Promise.all(jobs).catch((error) => {
    console.error("[booking email dispatch failed unexpectedly]", {
      appointment_id: context.appointment.id,
      error
    });
  });
}

function enqueueBookingReminder(context: BookingEmailContext): void {
  const settings = context.business.notificationSettings;

  if (!settings.reminder_enabled || !context.customer.email) {
    return;
  }

  const fireAt = new Date(
    context.appointment.startsAt.getTime() -
      settings.reminder_lead_minutes * 60_000
  );
  const minimumUsefulFireAt = Date.now() + 60_000;

  if (fireAt.getTime() <= minimumUsefulFireAt) {
    console.info("Booking reminder not scheduled because fire time is too soon", {
      appointment_id: context.appointment.id,
      fire_at: fireAt.toISOString()
    });
    return;
  }

  void enqueueReminder({
    appointmentId: context.appointment.id,
    fireAt
  }).catch((error) => {
    console.error("[booking reminder enqueue failed]", {
      appointment_id: context.appointment.id,
      fire_at: fireAt.toISOString(),
      error
    });
  });
}

/**
 * Lists appointments owned by the current business owner with optional filters.
 *
 * @param request - Incoming owner request with appointment filters in query params.
 * @returns Paginated appointment list or a typed error response.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ListAppointmentsResponse | ErrorResponse>> {
  const parsedQuery = listAppointmentsQuerySchema.safeParse({
    from: request.nextUrl.searchParams.get("from") ?? undefined,
    to: request.nextUrl.searchParams.get("to") ?? undefined,
    status: request.nextUrl.searchParams.get("status") ?? undefined,
    customer_q: request.nextUrl.searchParams.get("customer_q") ?? undefined,
    cursor: request.nextUrl.searchParams.get("cursor") ?? undefined,
    take: request.nextUrl.searchParams.get("take") ?? undefined
  });

  if (!parsedQuery.success) {
    return errorResponse(
      400,
      "VALIDATION_ERROR",
      "Τα φίλτρα δεν είναι σωστά.",
      validationDetails(parsedQuery.error.issues)
    );
  }

  try {
    const business = await getOwnerBusiness();

    if (!business) {
      return errorResponse(
        401,
        "UNAUTHENTICATED",
        "Χρειάζεται σύνδεση."
      );
    }

    const now = new Date();
    const from = parsedQuery.data.from
      ? new Date(parsedQuery.data.from)
      : now;
    const to = parsedQuery.data.to
      ? new Date(parsedQuery.data.to)
      : new Date(now.getTime() + 30 * 24 * 60 * 60_000);
    const result = await listAppointments(business.id, {
      cursor: parsedQuery.data.cursor,
      customerQuery: parsedQuery.data.customer_q,
      from,
      status: parsedQuery.data.status,
      take: parsedQuery.data.take,
      to
    });

    return NextResponse.json({
      appointments: result.items.map(serializeAppointmentWithRelations),
      next_cursor: result.nextCursor
    });
  } catch (error) {
    console.error("Failed to list owner appointments", {
      query: Object.fromEntries(request.nextUrl.searchParams.entries()),
      error
    });
    return errorResponse(
      500,
      "SERVER_ERROR",
      "Δεν μπορέσαμε να φορτώσουμε τις κρατήσεις."
    );
  }
}

/**
 * Creates a public guest booking after revalidating server-side availability.
 *
 * @param request - Incoming guest booking request.
 * @returns Created appointment details or a typed error response.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<AppointmentResponse | ErrorResponse>> {
  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    console.error("Appointment booking received invalid JSON", {
      error
    });
    return errorResponse(400, "VALIDATION_ERROR", "Το αίτημα δεν είναι σωστό.");
  }

  const parsed = createAppointmentSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(
      400,
      "VALIDATION_ERROR",
      "Τα στοιχεία κράτησης δεν είναι σωστά.",
      validationDetails(parsed.error.issues)
    );
  }

  const input = parsed.data;
  const startsAt = new Date(input.starts_at);

  if (Number.isNaN(startsAt.getTime())) {
    return errorResponse(
      400,
      "VALIDATION_ERROR",
      "Η ώρα κράτησης δεν είναι σωστή."
    );
  }

  const now = new Date();
  const minStartAt = new Date(now.getTime() + 60 * 60_000);
  const maxStartAt = new Date(now.getTime() + 90 * 24 * 60 * 60_000);

  if (startsAt.getTime() < minStartAt.getTime()) {
    return errorResponse(
      400,
      "TOO_SOON",
      "Η ώρα είναι πολύ κοντά. Διάλεξε ώρα τουλάχιστον σε 60 λεπτά."
    );
  }

  if (startsAt.getTime() > maxStartAt.getTime()) {
    return errorResponse(
      400,
      "BEYOND_HORIZON",
      "Η ώρα είναι εκτός ορίου 90 ημερών."
    );
  }

  try {
    const slotLockKey = `${input.service_id}:${startsAt.toISOString()}`;

    const result = await prisma.$transaction<BookingResult>(async (tx) => {
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtext(${input.business_id}), hashtext(${slotLockKey}))
      `;

      const business = await tx.business.findUnique({
        where: {
          id: input.business_id
        },
        select: {
          contactEmail: true,
          contactPhone: true,
          id: true,
          mapsUrl: true,
          name: true,
          notificationSettings: true,
          owner: {
            select: {
              email: true
            }
          },
          timezone: true,
          workingHours: true
        }
      });

      if (!business) {
        return {
          ok: false,
          status: 404,
          code: "NOT_FOUND",
          message: "Η επιχείρηση δεν βρέθηκε."
        };
      }

      const service = await tx.service.findUnique({
        where: {
          id: input.service_id
        },
        select: {
          id: true,
          businessId: true,
          durationMinutes: true,
          priceCents: true,
          currency: true,
          name: true,
          active: true
        }
      });

      if (!service || service.businessId !== input.business_id || !service.active) {
        return {
          ok: false,
          status: 400,
          code: "VALIDATION_ERROR",
          message: "Η υπηρεσία δεν είναι διαθέσιμη."
        };
      }

      const dateISO = localDateInTimezone(startsAt, business.timezone);
      const existingAppointments = await tx.appointment.findMany({
        where: {
          businessId: input.business_id,
          status: "scheduled"
        },
        select: {
          startsAt: true,
          endsAt: true
        }
      });
      const availableSlots = generateSlots(
        business,
        service,
        dateISO,
        existingAppointments
      );
      const matchingSlot = availableSlots.find(
        (slot) => slot.startsAt.getTime() === startsAt.getTime()
      );

      if (!matchingSlot) {
        return {
          ok: false,
          status: 409,
          code: "SLOT_TAKEN",
          message: "Η επιλεγμένη ώρα δεν είναι πλέον διαθέσιμη."
        };
      }

      const customerLookup = [
        ...(input.customer.email
          ? [{ businessId: input.business_id, email: input.customer.email }]
          : []),
        ...(input.customer.phone
          ? [{ businessId: input.business_id, phone: input.customer.phone }]
          : [])
      ];

      const existingCustomer =
        customerLookup.length > 0
          ? await tx.customer.findFirst({
              where: {
                OR: customerLookup
              }
            })
          : null;

      const customer = existingCustomer
        ? await tx.customer.update({
            where: {
              id: existingCustomer.id
            },
            data: {
              ...(existingCustomer.name.trim().length === 0
                ? { name: input.customer.name }
                : {})
            }
          })
        : await tx.customer.create({
            data: {
              businessId: input.business_id,
              name: input.customer.name,
              email: input.customer.email ?? null,
              phone: input.customer.phone ?? null
            }
          });

      const appointment = await tx.appointment.create({
        data: {
          businessId: input.business_id,
          customerId: customer.id,
          serviceId: service.id,
          startsAt: matchingSlot.startsAt,
          endsAt: matchingSlot.endsAt,
          status: "scheduled",
          paid: false,
          amountDueCents: service.priceCents,
          notes: input.note ?? null
        },
        include: {
          customer: {
            select: {
              name: true
            }
          },
          service: {
            select: {
              currency: true,
              name: true
            }
          }
        }
      });

      return {
        ok: true,
        appointment: serializeAppointment(appointment),
        emailContext: {
          appointment: {
            endsAt: appointment.endsAt,
            id: appointment.id,
            notes: appointment.notes,
            startsAt: appointment.startsAt
          },
          business: {
            contactEmail: business.contactEmail,
            contactPhone: business.contactPhone,
            mapsUrl: business.mapsUrl,
            name: business.name,
            notificationSettings: parseNotificationSettings(
              business.notificationSettings
            ),
            owner: {
              email: business.owner.email
            },
            timezone: business.timezone
          },
          customer: {
            email: customer.email,
            name: customer.name,
            phone: customer.phone
          },
          service: {
            currency: service.currency,
            durationMinutes: service.durationMinutes,
            name: service.name,
            priceCents: service.priceCents
          }
        }
      };
    });

    if (!result.ok) {
      return errorResponse(
        result.status,
        result.code,
        result.message,
        result.details
      );
    }

    dispatchBookingEmails(result.emailContext);
    enqueueBookingReminder(result.emailContext);

    return NextResponse.json(
      {
        appointment: result.appointment
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create appointment booking", {
      businessId: input.business_id,
      serviceId: input.service_id,
      startsAt: input.starts_at,
      error
    });
    return errorResponse(
      500,
      "SERVER_ERROR",
      "Δεν μπορέσαμε να ολοκληρώσουμε την κράτηση."
    );
  }
}
