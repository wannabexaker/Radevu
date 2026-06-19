import type {
  AppointmentInCustomerDTO,
  CustomerDetailDTO,
  CustomerSummaryDTO,
  UpdateCustomerInput
} from "@radevu/shared";
import type { AppointmentStatus, Prisma } from "@radevu/db";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getManagedBusinessForUser } from "@/lib/business-access";
import { prisma } from "@/lib/db";

const DEFAULT_TAKE = 50;

const customerAppointmentInclude = {
  service: {
    select: {
      currency: true,
      durationMinutes: true,
      id: true,
      name: true,
      priceCents: true
    }
  }
} satisfies Prisma.AppointmentInclude;

type CustomerAppointmentRow = Prisma.AppointmentGetPayload<{
  include: typeof customerAppointmentInclude;
}>;

type CustomerWithAppointments = Prisma.CustomerGetPayload<{
  include: {
    appointments: {
      include: typeof customerAppointmentInclude;
    };
  };
}>;

export type CustomerSummary = {
  appointmentsCount: number;
  businessId: string;
  email: string | null;
  futureRecommendation: string | null;
  id: string;
  lastAppointmentAt: Date | null;
  name: string;
  notes: string | null;
  phone: string | null;
  totalSpentCents: number;
};

export type CustomerAppointment = {
  amountDueCents: number;
  businessId: string;
  customerId: string;
  endsAt: Date;
  id: string;
  notes: string | null;
  paid: boolean;
  service: {
    currency: string;
    durationMinutes: number;
    id: string;
    name: string;
    priceCents: number;
  };
  serviceId: string;
  startsAt: Date;
  status: AppointmentStatus;
};

export type CustomerDetail = CustomerSummary & {
  appointments: CustomerAppointment[];
  createdAt: Date;
  updatedAt: Date;
};

export type CustomerDebtAppointment = CustomerAppointment & {
  customer: {
    email: string | null;
    id: string;
    name: string;
    phone: string | null;
  };
};

export type CustomerDebtGroup = {
  appointments: CustomerDebtAppointment[];
  customer: {
    email: string | null;
    id: string;
    name: string;
    phone: string | null;
  };
  totalOwedCents: number;
};

export type CustomerOwnerScopeResult =
  | {
      business: {
        id: string;
        timezone: string;
      };
      customer?: {
        businessId: string;
        id: string;
      };
      ok: true;
    }
  | {
      code: "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND";
      ok: false;
    };

type ListCustomersInput = {
  cursor?: string;
  search?: string;
  take?: number;
};

function normalizeOptionalText(value: string | undefined): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function customerSearchWhere(
  businessId: string,
  search: string | undefined
): Prisma.CustomerWhereInput {
  const trimmedSearch = search?.trim();

  if (!trimmedSearch) {
    return {
      businessId
    };
  }

  return {
    businessId,
    OR: [
      {
        name: {
          contains: trimmedSearch,
          mode: "insensitive"
        }
      },
      {
        email: {
          contains: trimmedSearch,
          mode: "insensitive"
        }
      },
      {
        phone: {
          contains: trimmedSearch,
          mode: "insensitive"
        }
      }
    ]
  };
}

function totalSpentCents(appointments: CustomerAppointmentRow[]): number {
  return appointments.reduce((total, appointment) => {
    if (!appointment.paid || appointment.status === "cancelled") {
      return total;
    }

    return total + appointment.amountDueCents;
  }, 0);
}

function toCustomerAppointment(
  appointment: CustomerAppointmentRow
): CustomerAppointment {
  return {
    amountDueCents: appointment.amountDueCents,
    businessId: appointment.businessId,
    customerId: appointment.customerId,
    endsAt: appointment.endsAt,
    id: appointment.id,
    notes: appointment.notes,
    paid: appointment.paid,
    service: {
      currency: appointment.service.currency,
      durationMinutes: appointment.service.durationMinutes,
      id: appointment.service.id,
      name: appointment.service.name,
      priceCents: appointment.service.priceCents
    },
    serviceId: appointment.serviceId,
    startsAt: appointment.startsAt,
    status: appointment.status
  };
}

function toCustomerSummary(customer: CustomerWithAppointments): CustomerSummary {
  const latestAppointment = customer.appointments[0] ?? null;

  return {
    appointmentsCount: customer.appointments.length,
    businessId: customer.businessId,
    email: customer.email,
    futureRecommendation: customer.futureRecommendation,
    id: customer.id,
    lastAppointmentAt: latestAppointment?.startsAt ?? null,
    name: customer.name,
    notes: customer.notes,
    phone: customer.phone,
    totalSpentCents: totalSpentCents(customer.appointments)
  };
}

function compareCustomerSummaries(
  left: CustomerSummary,
  right: CustomerSummary
): number {
  const leftTime = left.lastAppointmentAt?.getTime() ?? 0;
  const rightTime = right.lastAppointmentAt?.getTime() ?? 0;

  if (rightTime !== leftTime) {
    return rightTime - leftTime;
  }

  return left.name.localeCompare(right.name, "el-GR");
}

/**
 * Verifies the current owner session can access a business or customer scope.
 *
 * @param input - Optional business id or customer id to scope-check.
 * @returns Owner business scope, optional customer scope, or a typed auth failure.
 * @throws Error when session or Prisma lookup fails unexpectedly.
 */
export async function requireCustomerOwnerScope(input: {
  businessId?: string;
  customerId?: string;
}): Promise<CustomerOwnerScopeResult> {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return {
      code: "UNAUTHENTICATED",
      ok: false
    };
  }

  const managedBusiness = await getManagedBusinessForUser(session.user.id);
  const business = managedBusiness
    ? { id: managedBusiness.id, timezone: managedBusiness.timezone }
    : null;

  if (!business) {
    return {
      code: "FORBIDDEN",
      ok: false
    };
  }

  if (input.businessId && input.businessId !== business.id) {
    return {
      code: "FORBIDDEN",
      ok: false
    };
  }

  if (!input.customerId) {
    return {
      business,
      ok: true
    };
  }

  const customer = await prisma.customer.findUnique({
    where: {
      id: input.customerId
    },
    select: {
      businessId: true,
      id: true
    }
  });

  if (!customer) {
    return {
      code: "NOT_FOUND",
      ok: false
    };
  }

  if (customer.businessId !== business.id) {
    return {
      code: "FORBIDDEN",
      ok: false
    };
  }

  return {
    business,
    customer,
    ok: true
  };
}

/**
 * Lists customers for one business with search and cursor pagination.
 *
 * @param businessId - Business id used as the tenant boundary.
 * @param input - Optional search term, cursor id, and page size.
 * @returns Customer summaries ordered by most recent booking plus next cursor.
 * @throws Error when Prisma query fails.
 */
export async function listCustomers(
  businessId: string,
  input: ListCustomersInput
): Promise<{ items: CustomerSummary[]; nextCursor: string | null }> {
  const take = input.take ?? DEFAULT_TAKE;
  const customers = await prisma.customer.findMany({
    include: {
      appointments: {
        include: customerAppointmentInclude,
        orderBy: [
          {
            startsAt: "desc"
          },
          {
            id: "asc"
          }
        ]
      }
    },
    where: customerSearchWhere(businessId, input.search)
  });
  const summaries = customers.map(toCustomerSummary).sort(compareCustomerSummaries);
  const cursorIndex = input.cursor
    ? summaries.findIndex((customer) => customer.id === input.cursor)
    : -1;
  const startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;
  const page = summaries.slice(startIndex, startIndex + take);

  return {
    items: page,
    nextCursor:
      summaries.length > startIndex + take ? page[page.length - 1]?.id ?? null : null
  };
}

/**
 * Loads one customer and their booking history inside a business tenant boundary.
 *
 * @param businessId - Business id used as the tenant boundary.
 * @param customerId - Customer id to load.
 * @returns Customer detail with booking history, or null if outside the business.
 * @throws Error when Prisma query fails.
 */
export async function getCustomer(
  businessId: string,
  customerId: string
): Promise<CustomerDetail | null> {
  const customer = await prisma.customer.findFirst({
    include: {
      appointments: {
        include: customerAppointmentInclude,
        orderBy: [
          {
            startsAt: "desc"
          },
          {
            id: "asc"
          }
        ]
      }
    },
    where: {
      businessId,
      id: customerId
    }
  });

  if (!customer) {
    return null;
  }

  return {
    ...toCustomerSummary(customer),
    appointments: customer.appointments.map(toCustomerAppointment),
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt
  };
}

/**
 * Updates minimal CRM fields for a customer inside a business tenant boundary.
 *
 * @param businessId - Business id used as the tenant boundary.
 * @param customerId - Customer id to mutate.
 * @param patch - Notes and next recommendation patch.
 * @returns Resolves when the update is committed.
 * @throws Error when the customer is missing or Prisma update fails.
 */
export async function updateCustomer(
  businessId: string,
  customerId: string,
  patch: UpdateCustomerInput
): Promise<void> {
  const updated = await prisma.customer.updateMany({
    data: {
      ...(patch.notes === undefined
        ? {}
        : { notes: normalizeOptionalText(patch.notes) }),
      ...(patch.future_recommendation === undefined
        ? {}
        : {
            futureRecommendation: normalizeOptionalText(
              patch.future_recommendation
            )
          })
    },
    where: {
      businessId,
      id: customerId
    }
  });

  if (updated.count === 0) {
    throw new Error("Customer was not found for this business.");
  }
}

/**
 * Lists unpaid scheduled or completed bookings grouped by customer.
 *
 * @param businessId - Business id used as the tenant boundary.
 * @returns Customer debt groups with unpaid bookings and total owed cents.
 * @throws Error when Prisma query fails.
 */
export async function listUnpaidByCustomer(
  businessId: string
): Promise<CustomerDebtGroup[]> {
  const rows = await prisma.appointment.findMany({
    include: {
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
      }
    },
    orderBy: [
      {
        startsAt: "asc"
      },
      {
        id: "asc"
      }
    ],
    where: {
      businessId,
      paid: false,
      status: {
        in: ["scheduled", "done"]
      }
    }
  });
  const groups = new Map<string, CustomerDebtGroup>();

  for (const row of rows) {
    const appointment: CustomerDebtAppointment = {
      ...toCustomerAppointment(row),
      customer: row.customer
    };
    const existing = groups.get(row.customerId);

    if (existing) {
      existing.appointments.push(appointment);
      existing.totalOwedCents += row.amountDueCents;
      continue;
    }

    groups.set(row.customerId, {
      appointments: [appointment],
      customer: row.customer,
      totalOwedCents: row.amountDueCents
    });
  }

  return Array.from(groups.values()).sort((left, right) =>
    left.customer.name.localeCompare(right.customer.name, "el-GR")
  );
}

/**
 * Serializes a customer summary into snake_case JSON.
 *
 * @param customer - Customer summary from the server data layer.
 * @returns API-safe customer summary DTO.
 */
export function serializeCustomerSummary(
  customer: CustomerSummary
): CustomerSummaryDTO {
  return {
    id: customer.id,
    business_id: customer.businessId,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    notes: customer.notes,
    future_recommendation: customer.futureRecommendation,
    last_appointment_at: customer.lastAppointmentAt?.toISOString() ?? null,
    appointments_count: customer.appointmentsCount,
    total_spent_cents: customer.totalSpentCents
  };
}

/**
 * Serializes a customer detail into snake_case JSON.
 *
 * @param customer - Customer detail from the server data layer.
 * @returns API-safe customer detail DTO.
 */
export function serializeCustomerDetail(
  customer: CustomerDetail
): CustomerDetailDTO {
  return {
    ...serializeCustomerSummary(customer),
    created_at: customer.createdAt.toISOString(),
    updated_at: customer.updatedAt.toISOString()
  };
}

/**
 * Serializes a customer booking history row into snake_case JSON.
 *
 * @param appointment - Appointment history row from the server data layer.
 * @returns API-safe appointment DTO for customer history.
 */
export function serializeAppointmentInCustomer(
  appointment: CustomerAppointment
): AppointmentInCustomerDTO {
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
    service: {
      id: appointment.service.id,
      name: appointment.service.name,
      duration_minutes: appointment.service.durationMinutes,
      price_cents: appointment.service.priceCents,
      currency: appointment.service.currency
    }
  };
}
