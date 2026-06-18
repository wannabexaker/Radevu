import { PrismaClient } from "@prisma/client";
import {
  createSeedAuth,
  demoPassword,
  loadEnvFile,
  upsertBusinessWithOwner,
  weekdayHours,
  type BusinessSeedSpec
} from "./seed.ts";

// E2E-ONLY fixture. Never run in production / never shown on the landing or
// directory: category stays null and showOnLanding is false. The Playwright
// specs hardcode this owner, slug, and public heading name, so keep them in
// sync with apps/web/tests/e2e/*.spec.ts.
const e2eFixtureName = "QA Demo";
const e2eFixtureSlug = "qa-demo";
const e2eOwnerEmail = "dimos.is.dev+qa@gmail.com";

function e2eFixtureSpec(): BusinessSeedSpec {
  return {
    businessName: e2eFixtureName,
    contactEmail: e2eOwnerEmail,
    contactPhone: null,
    logoUrl: null,
    mapsUrl: null,
    ownerEmail: e2eOwnerEmail,
    ownerPassword: demoPassword("SEED_QA_PASSWORD", "QaDemo2026!"),
    photoUrl: null,
    services: [
      {
        durationMinutes: 30,
        name: "Υπηρεσία 30'",
        priceCents: 1500
      },
      {
        durationMinutes: 20,
        name: "Υπηρεσία 20'",
        priceCents: 800
      },
      {
        durationMinutes: 45,
        name: "Υπηρεσία 45'",
        priceCents: 2000
      }
    ],
    showOnLanding: false,
    slug: e2eFixtureSlug,
    socialLinks: {},
    timezone: "Europe/Athens",
    workingHours: {
      ...weekdayHours("09:00", "19:00"),
      sat: [{ open: "09:00", close: "15:00" }]
    }
  };
}

async function main(): Promise<void> {
  loadEnvFile();

  const prisma = new PrismaClient();

  try {
    const auth = await createSeedAuth(prisma);

    await upsertBusinessWithOwner(prisma, auth, e2eFixtureSpec());
    console.info("[seed:e2e] fixture ready", {
      slug: e2eFixtureSlug
    });
  } catch (error) {
    console.error("Failed to seed Radevu e2e fixture", {
      error
    });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

await main();
