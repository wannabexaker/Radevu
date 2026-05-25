import { z } from "zod";
import {
  BUSINESS_SLUG_MAX_LENGTH,
  BUSINESS_SLUG_REGEX,
  RESERVED_DEMO_SLUGS,
  RESERVED_SLUGS
} from "../constants.js";

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

export type RegisterBusinessInput = z.infer<typeof registerBusinessSchema>;
export type UpdateVisibilityInput = z.infer<typeof updateVisibilitySchema>;
