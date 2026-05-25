import { z } from "zod";

export const contactRequestSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(254),
  phone: z.string().min(5).max(20).optional(),
  message: z.string().min(10).max(2000)
});

export type ContactRequestInput = z.infer<typeof contactRequestSchema>;
