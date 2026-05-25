import { z } from "zod";

const optionalNonEmptyString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().optional()
);

const customerSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: optionalNonEmptyString.pipe(z.string().email().max(254).optional()),
    phone: optionalNonEmptyString.pipe(z.string().trim().min(5).max(20).optional())
  })
  .refine((customer) => Boolean(customer.email || customer.phone), {
    message: "Email or phone is required",
    path: ["email"]
  });

export const createAppointmentSchema = z.object({
  business_id: z.string().cuid(),
  service_id: z.string().cuid(),
  starts_at: z.string().datetime({ offset: true }),
  customer: customerSchema,
  note: optionalNonEmptyString.pipe(z.string().trim().max(500).optional())
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const appointmentStatusSchema = z.enum([
  "scheduled",
  "done",
  "cancelled"
]);

const statusListSchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  return value
    .split(",")
    .map((status) => status.trim())
    .filter(Boolean);
}, z.array(appointmentStatusSchema).optional());

const optionalPositiveIntSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "string") {
    return Number(value);
  }

  return value;
}, z.number().int().min(1).max(100).optional());

export const listAppointmentsQuerySchema = z.object({
  from: optionalNonEmptyString.pipe(
    z.string().datetime({ offset: true }).optional()
  ),
  to: optionalNonEmptyString.pipe(
    z.string().datetime({ offset: true }).optional()
  ),
  status: statusListSchema,
  customer_q: optionalNonEmptyString.pipe(z.string().trim().max(100).optional()),
  cursor: optionalNonEmptyString.pipe(z.string().cuid().optional()),
  take: optionalPositiveIntSchema
});

export const updateAppointmentSchema = z
  .object({
    status: appointmentStatusSchema.optional(),
    paid: z.boolean().optional(),
    notes: optionalNonEmptyString.pipe(z.string().trim().max(500).optional())
  })
  .refine(
    (input) =>
      input.status !== undefined ||
      input.paid !== undefined ||
      input.notes !== undefined,
    {
      message: "At least one field is required"
    }
  );

export type AppointmentStatusDTO = z.infer<typeof appointmentStatusSchema>;
export type ListAppointmentsQueryInput = z.infer<
  typeof listAppointmentsQuerySchema
>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;

export type AppointmentDTO = {
  id: string;
  business_id: string;
  customer_id: string;
  service_id: string;
  starts_at: string;
  ends_at: string;
  status: "scheduled" | "done" | "cancelled";
  paid: boolean;
  amount_due_cents: number;
  currency: string;
  customer_name: string;
  service_name: string;
};

export type CreateAppointmentResponse = {
  appointment: AppointmentDTO;
};

export type AppointmentWithRelationsDTO = {
  id: string;
  business_id: string;
  customer_id: string;
  service_id: string;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatusDTO;
  paid: boolean;
  amount_due_cents: number;
  notes: string | null;
  customer: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  };
  service: {
    id: string;
    name: string;
    duration_minutes: number;
    price_cents: number;
    currency: string;
  };
};

export type ListAppointmentsResponse = {
  appointments: AppointmentWithRelationsDTO[];
  next_cursor: string | null;
};

export type GetAppointmentResponse = {
  appointment: AppointmentWithRelationsDTO;
};
