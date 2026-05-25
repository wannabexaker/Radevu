import { z } from "zod";

export const createServiceSchema = z.object({
  name: z.string().min(2).max(80),
  duration_minutes: z.number().int().min(5).max(720),
  price_cents: z.number().int().min(0).max(1_000_000),
  description: z.string().max(500).optional()
});

export const updateServiceSchema = createServiceSchema
  .partial()
  .extend({
    active: z.boolean().optional()
  });

const booleanString = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return value;
}, z.boolean().optional());

export const serviceQuerySchema = z.object({
  active: booleanString
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type ServiceQueryInput = z.infer<typeof serviceQuerySchema>;
