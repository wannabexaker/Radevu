import { z } from "zod";

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format");

function intFromQuery(schema: z.ZodNumber): z.ZodEffects<z.ZodNumber, number, unknown> {
  return z.preprocess((value) => {
    if (typeof value === "string") {
      return Number(value);
    }

    return value;
  }, schema);
}

export const availabilityQuerySchema = z.object({
  service_id: z.string().cuid(),
  date: isoDateSchema
});

export const monthAvailabilityQuerySchema = z.object({
  service_id: z.string().cuid(),
  year: intFromQuery(z.number().int().min(2020).max(2100)),
  month: intFromQuery(z.number().int().min(1).max(12))
});

export type AvailabilityQueryInput = z.infer<typeof availabilityQuerySchema>;
export type MonthAvailabilityQueryInput = z.infer<
  typeof monthAvailabilityQuerySchema
>;

export type AvailabilityErrorCode =
  | "BEYOND_HORIZON"
  | "PAST_MONTH"
  | "PAST_DATE"
  | "TOO_SOON";

export type AvailabilitySlotDTO = {
  starts_at: string;
  ends_at: string;
};

export type AvailabilityResponse = {
  slots: AvailabilitySlotDTO[];
};

export type MonthAvailabilityDayDTO = {
  date: string;
  slot_count: number;
  state: "closed" | "full" | "tight" | "available" | "open";
};

export type MonthAvailabilityDTO = {
  days: MonthAvailabilityDayDTO[];
};
