import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  radevuPrisma?: PrismaClient;
};

export const prisma = globalForPrisma.radevuPrisma ?? new PrismaClient();

globalForPrisma.radevuPrisma = prisma;

export {
  AppointmentMessageAuthorRole,
  AppointmentStatus,
  UserType
} from "@prisma/client";
export type {
  Account,
  Appointment,
  AppointmentMessage,
  Business,
  ContactRequest,
  Customer,
  Prisma,
  Service,
  Session,
  User,
  Verification
} from "@prisma/client";
