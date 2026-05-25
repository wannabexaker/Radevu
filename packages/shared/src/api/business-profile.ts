import { z } from "zod";

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const phoneSchema = z
  .string()
  .trim()
  .min(5)
  .max(20)
  .regex(/^[\d\s+\-()]+$/);
const uploadUrlSchema = z
  .string()
  .regex(/^\/uploads\/[A-Za-z0-9_\-./]+$/)
  .refine((value) => !value.includes(".."), {
    message: "Upload URL cannot contain path traversal"
  });

const mapsUrlSchema = z.string().url().refine(
  (value) =>
    /^https:\/\/maps\.app\.goo\.gl\//.test(value) ||
    /^https:\/\/maps\.google\.com\//.test(value) ||
    /^https:\/\/goo\.gl\/maps\//.test(value) ||
    /^https:\/\/www\.google\.com\/maps\//.test(value),
  {
    message: "Maps URL must be a Google Maps link"
  }
);

const instagramUrlSchema = z.string().url().refine(
  (value) =>
    /^https:\/\/instagram\.com\//.test(value) ||
    /^https:\/\/www\.instagram\.com\//.test(value),
  {
    message: "Instagram URL must be an Instagram link"
  }
);

const facebookUrlSchema = z.string().url().refine(
  (value) =>
    /^https:\/\/facebook\.com\//.test(value) ||
    /^https:\/\/www\.facebook\.com\//.test(value) ||
    /^https:\/\/m\.facebook\.com\//.test(value) ||
    /^https:\/\/fb\.com\//.test(value) ||
    /^https:\/\/www\.fb\.com\//.test(value),
  {
    message: "Facebook URL must be a Facebook link"
  }
);

export const socialLinksSchema = z
  .object({
    instagram: instagramUrlSchema.optional(),
    facebook: facebookUrlSchema.optional()
  })
  .strict();

const intervalSchema = z
  .object({
    open: timeSchema,
    close: timeSchema
  })
  .refine((interval) => interval.close > interval.open, {
    message: "Close time must be after open time",
    path: ["close"]
  });

function hasNoOverlap(
  intervals: Array<{
    close: string;
    open: string;
  }>
): boolean {
  const sorted = [...intervals].sort((a, b) => a.open.localeCompare(b.open));

  return sorted.every((interval, index) => {
    const previous = sorted[index - 1];
    return !previous || previous.close <= interval.open;
  });
}

const dayIntervalsSchema = z
  .array(intervalSchema)
  .refine((intervals) => hasNoOverlap(intervals), {
    message: "Intervals cannot overlap"
  });

export const workingHoursSchema = z.object({
  mon: dayIntervalsSchema,
  tue: dayIntervalsSchema,
  wed: dayIntervalsSchema,
  thu: dayIntervalsSchema,
  fri: dayIntervalsSchema,
  sat: dayIntervalsSchema,
  sun: dayIntervalsSchema
});

export const updateBusinessProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    contact_email: z.string().trim().email().max(254).nullable().optional(),
    contact_phone: phoneSchema.nullable().optional(),
    logo_url: uploadUrlSchema.nullable().optional(),
    photo_url: uploadUrlSchema.nullable().optional(),
    social_links: socialLinksSchema.optional(),
    maps_url: mapsUrlSchema.nullable().optional(),
    working_hours: workingHoursSchema.optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

export type SocialLinksInput = z.infer<typeof socialLinksSchema>;
export type UpdateBusinessProfileInput = z.infer<
  typeof updateBusinessProfileSchema
>;
export type WorkingHoursInput = z.infer<typeof workingHoursSchema>;
