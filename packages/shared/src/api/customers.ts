import type { AppointmentStatusDTO } from "./appointments.js";
import { z } from "zod";

const optionalNonEmptyString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().optional()
);

const optionalPositiveIntSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "string") {
    return Number(value);
  }

  return value;
}, z.number().int().min(1).max(100).optional());

export const listCustomersQuerySchema = z.object({
  search: optionalNonEmptyString.pipe(z.string().trim().max(100).optional()),
  cursor: optionalNonEmptyString.pipe(z.string().trim().min(1).max(191).optional()),
  take: optionalPositiveIntSchema
});

export const updateCustomerSchema = z
  .object({
    notes: z.string().trim().max(2000).optional(),
    future_recommendation: z.string().trim().max(500).optional()
  })
  .refine(
    (input) =>
      input.notes !== undefined || input.future_recommendation !== undefined,
    {
      message: "At least one field is required"
    }
  );

export type ListCustomersQueryInput = z.infer<typeof listCustomersQuerySchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

export type CustomerSummaryDTO = {
  id: string;
  business_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  future_recommendation: string | null;
  last_appointment_at: string | null;
  appointments_count: number;
  total_spent_cents: number;
};

export type CustomerDetailDTO = CustomerSummaryDTO & {
  created_at: string;
  updated_at: string;
};

export type AppointmentInCustomerDTO = {
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
  service: {
    id: string;
    name: string;
    duration_minutes: number;
    price_cents: number;
    currency: string;
  };
};

export type ListCustomersResponse = {
  customers: CustomerSummaryDTO[];
  next_cursor: string | null;
};

export type GetCustomerResponse = {
  customer: CustomerDetailDTO;
  appointments: AppointmentInCustomerDTO[];
};

export type UpdateCustomerResponse = {
  customer: CustomerDetailDTO;
};
