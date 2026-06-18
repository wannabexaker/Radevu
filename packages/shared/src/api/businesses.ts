import { z } from "zod";
import {
  BUSINESS_CATEGORIES,
  BUSINESS_SLUG_MAX_LENGTH,
  BUSINESS_SLUG_REGEX,
  RESERVED_DEMO_SLUGS,
  RESERVED_SLUGS
} from "../constants.js";

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
}, z.number().int().min(1).max(50).optional());

export const registerBusinessSchema = z.object({
  owner_email: z.string().email().max(254),
  owner_password: z.string().min(8).max(128),
  business_name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(1)
    .max(BUSINESS_SLUG_MAX_LENGTH)
    .regex(BUSINESS_SLUG_REGEX, "Invalid slug format")
    .refine(
      (slug) => !RESERVED_SLUGS.has(slug) && !RESERVED_DEMO_SLUGS.has(slug),
      {
        message: "Αυτό το slug είναι δεσμευμένο. Δοκίμασε ένα διαφορετικό."
      }
    )
});

export const updateVisibilitySchema = z.object({
  show_on_landing: z.boolean()
});

export const listBusinessDirectoryQuerySchema = z.object({
  category: optionalNonEmptyString.pipe(z.enum(BUSINESS_CATEGORIES).optional()),
  cursor: optionalNonEmptyString.pipe(z.string().trim().min(1).max(191).optional()),
  search: optionalNonEmptyString.pipe(z.string().trim().max(80).optional()),
  take: optionalPositiveIntSchema
});

export type RegisterBusinessInput = z.infer<typeof registerBusinessSchema>;
export type ListBusinessDirectoryQueryInput = z.infer<
  typeof listBusinessDirectoryQuerySchema
>;
export type UpdateVisibilityInput = z.infer<typeof updateVisibilitySchema>;

export type BusinessDirectoryDTO = {
  category: string | null;
  description: string | null;
  id: string;
  logo_url: string | null;
  name: string;
  photo_url: string | null;
  slug: string;
};

export type ListBusinessDirectoryResponse = {
  businesses: BusinessDirectoryDTO[];
  next_cursor: string | null;
};
