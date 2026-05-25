import { z } from "zod";

export const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export type DayKey = (typeof dayKeys)[number];

export type Interval = {
  open: string;
  close: string;
};

export type WorkingHours = Record<DayKey, Interval[]>;

const emptyWorkingHours: WorkingHours = {
  sun: [],
  mon: [],
  tue: [],
  wed: [],
  thu: [],
  fri: [],
  sat: []
};

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

const intervalSchema = z
  .object({
    open: timeSchema,
    close: timeSchema
  })
  .refine((interval) => interval.open < interval.close, {
    message: "Close time must be after open time",
    path: ["close"]
  });

export const workingHoursSchema = z
  .object({
    sun: z.array(intervalSchema).default([]),
    mon: z.array(intervalSchema).default([]),
    tue: z.array(intervalSchema).default([]),
    wed: z.array(intervalSchema).default([]),
    thu: z.array(intervalSchema).default([]),
    fri: z.array(intervalSchema).default([]),
    sat: z.array(intervalSchema).default([])
  })
  .partial()
  .transform((value) => ({
    ...emptyWorkingHours,
    ...value
  }));

/**
 * Parses persisted working-hours JSON into a complete weekly schedule.
 *
 * @param value - Unknown JSON value from storage or API props.
 * @returns A normalized working-hours object; invalid input is treated as closed.
 */
export function parseWorkingHours(value: unknown): WorkingHours {
  const parsed = workingHoursSchema.safeParse(value);

  if (!parsed.success) {
    return emptyWorkingHours;
  }

  return parsed.data;
}

/**
 * Returns opening intervals for a numeric weekday.
 *
 * @param workingHours - Normalized weekly working hours.
 * @param dayOfWeek - JavaScript weekday number where Sunday is 0.
 * @returns The configured intervals for the given day.
 */
export function getDayIntervals(
  workingHours: WorkingHours,
  dayOfWeek: number
): Interval[] {
  const dayKey = dayKeys[dayOfWeek];

  if (!dayKey) {
    return [];
  }

  return workingHours[dayKey];
}
