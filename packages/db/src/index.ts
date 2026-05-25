import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  radevuPrisma?: PrismaClient;
};

export const prisma = globalForPrisma.radevuPrisma ?? new PrismaClient();

globalForPrisma.radevuPrisma = prisma;

export { AppointmentStatus } from "@prisma/client";
export type {
  Account,
  Appointment,
  Business,
  Customer,
  Prisma,
  Service,
  Session,
  User,
  Verification
} from "@prisma/client";
