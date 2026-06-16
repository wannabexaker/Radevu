import { z } from "zod";
import {
  BUSINESS_SLUG_MAX_LENGTH,
  BUSINESS_SLUG_REGEX,
  RESERVED_DEMO_SLUGS,
  RESERVED_SLUGS
} from "../constants.js";

const optionalNonEmptyString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().optional()
);

const baseAuthSecuritySchema = z.object({
  turnstile_token: z.string().trim().min(1).max(4096),
  honeypot: z.string().max(0).optional().default(""),
  form_started_at: z.coerce.number().int().positive()
});

const baseRegisterSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(2).max(100),
  phone: optionalNonEmptyString.pipe(
    z.string().trim().min(5).max(20).optional()
  ),
  marketing_opt_in: z.boolean().optional().default(false)
});

export const registerCustomerAuthSchema = baseRegisterSchema
  .extend({
    user_type: z.literal("customer")
  })
  .merge(baseAuthSecuritySchema);

export const registerBusinessAuthSchema = baseRegisterSchema
  .extend({
    user_type: z.literal("business_owner"),
    business_name: z.string().trim().min(2).max(100),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(BUSINESS_SLUG_MAX_LENGTH)
      .regex(BUSINESS_SLUG_REGEX, "Invalid slug format")
      .refine(
        (slug) => !RESERVED_SLUGS.has(slug) && !RESERVED_DEMO_SLUGS.has(slug),
        {
          message: "Αυτό το slug είναι δεσμευμένο. Δοκίμασε ένα διαφορετικό."
        }
      )
  })
  .merge(baseAuthSecuritySchema);

export const registerAuthSchema = z.discriminatedUnion("user_type", [
  registerCustomerAuthSchema,
  registerBusinessAuthSchema
]);

export const resendVerificationEmailSchema = z
  .object({
    email: z.string().trim().email().max(254)
  })
  .merge(baseAuthSecuritySchema);

export const forgotPasswordSchema = z
  .object({
    email: z.string().trim().email().max(254)
  })
  .merge(baseAuthSecuritySchema);

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  new_password: z.string().min(10).max(128)
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(10).max(128)
});

export type RegisterCustomerAuthInput = z.infer<
  typeof registerCustomerAuthSchema
>;
export type RegisterBusinessAuthInput = z.infer<
  typeof registerBusinessAuthSchema
>;
export type RegisterAuthInput = z.infer<typeof registerAuthSchema>;
export type ResendVerificationEmailInput = z.infer<
  typeof resendVerificationEmailSchema
>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
