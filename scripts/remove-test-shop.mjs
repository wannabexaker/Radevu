import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

// Maintenance helper: removes the legacy `test-shop` business (previously seeded
// as "Κουρείο Δοκιμής") from a database. The production seed no longer manages
// it, so existing dev/staging databases keep the stale rows until this runs.
// Idempotent and transactional — safe to run repeatedly. Requires DATABASE_URL.
// @prisma/client lives in packages/db, so resolve it from there explicitly.
const slug = "test-shop";

const dbRequire = createRequire(
  new URL("../packages/db/package.json", import.meta.url)
);
const { PrismaClient } = await import(
  pathToFileURL(dbRequire.resolve("@prisma/client")).href
);

async function main() {
  const prisma = new PrismaClient();

  try {
    const business = await prisma.business.findUnique({
      where: { slug },
      select: { id: true, ownerId: true }
    });

    if (!business) {
      console.info("[remove-test-shop] nothing to remove", { slug });
      return;
    }

    await prisma.$transaction([
      prisma.appointmentMessage.deleteMany({
        where: { businessId: business.id }
      }),
      prisma.appointment.deleteMany({ where: { businessId: business.id } }),
      prisma.customer.deleteMany({ where: { businessId: business.id } }),
      prisma.service.deleteMany({ where: { businessId: business.id } }),
      prisma.business.deleteMany({ where: { id: business.id } }),
      prisma.user.deleteMany({ where: { id: business.ownerId } })
    ]);

    console.info("[remove-test-shop] removed", { slug });
  } catch (error) {
    console.error("[remove-test-shop] failed", { error });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(() => {
  process.exitCode = 1;
});
