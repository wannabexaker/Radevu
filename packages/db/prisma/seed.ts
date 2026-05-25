import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { PrismaClient, type Prisma } from "@prisma/client";

const envFileUrl = new URL("../../../infra/.env", import.meta.url);
const webRequire = createRequire(
  new URL("../../../apps/web/package.json", import.meta.url)
);

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

type WorkingHours = Record<DayKey, Array<{ close: string; open: string }>>;

type ServiceSpec = {
  durationMinutes: number;
  name: string;
  priceCents: number;
};

type BusinessSeedSpec = {
  businessName: string;
  contactEmail: string;
  contactPhone: string | null;
  logoUrl: string | null;
  mapsUrl: string | null;
  ownerEmail: string;
  ownerPassword: string;
  photoUrl: string | null;
  services: ServiceSpec[];
  showOnLanding: boolean;
  slug: string;
  socialLinks: Prisma.InputJsonObject;
  timezone: string;
  workingHours: WorkingHours;
};

const defaultNotificationSettings = {
  confirmation_enabled: true,
  reminder_enabled: true,
  reminder_lead_minutes: 1440
} satisfies Prisma.InputJsonObject;

function loadEnvFile(): void {
  if (!existsSync(envFileUrl)) {
    return;
  }

  const content = readFileSync(envFileUrl, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split("=");
    const value = valueParts.join("=").trim();

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

async function createSeedAuth(prisma: PrismaClient) {
  const { betterAuth } = await import(
    pathToFileURL(webRequire.resolve("better-auth")).href
  );
  const { prismaAdapter } = await import(
    pathToFileURL(webRequire.resolve("better-auth/adapters/prisma")).href
  );

  return betterAuth({
    database: prismaAdapter(prisma, { provider: "postgresql" }),
    emailAndPassword: {
      autoSignIn: false,
      enabled: true
    },
    secret:
      process.env.BETTER_AUTH_SECRET ??
      "seed_secret_for_local_development_only",
    baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000"
  });
}

function demoPassword(envKey: string, fallback: string): string {
  const value = process.env[envKey]?.trim();
  return value ? value : fallback;
}

function warnAboutDefaultPasswords(): void {
  if (
    process.env.SEED_DESPOINA_PASSWORD?.trim() &&
    process.env.SEED_IOANNIS_PASSWORD?.trim()
  ) {
    return;
  }

  console.warn(
    "\x1b[33m[seed] using default demo passwords — set SEED_*_PASSWORD in .env for real deployments\x1b[0m"
  );
}

function weekdayHours(open: string, close: string): WorkingHours {
  return {
    mon: [{ open, close }],
    tue: [{ open, close }],
    wed: [{ open, close }],
    thu: [{ open, close }],
    fri: [{ open, close }],
    sat: [],
    sun: []
  };
}

const testShopHours: WorkingHours = {
  ...weekdayHours("09:00", "19:00"),
  sat: [{ open: "09:00", close: "15:00" }]
};

const despoinaHours: WorkingHours = {
  ...weekdayHours("15:00", "21:00"),
  sat: [{ open: "10:00", close: "14:00" }]
};

const ioannisHours: WorkingHours = {
  mon: [{ open: "09:00", close: "20:00" }],
  tue: [{ open: "09:00", close: "20:00" }],
  wed: [{ open: "09:00", close: "20:00" }],
  thu: [{ open: "09:00", close: "20:00" }],
  fri: [{ open: "09:00", close: "20:00" }],
  sat: [{ open: "09:00", close: "20:00" }],
  sun: []
};

function seedSpecs(): BusinessSeedSpec[] {
  return [
    {
      businessName: "Κουρείο Δοκιμής",
      contactEmail: "barber@radevu.local",
      contactPhone: "2101234567",
      logoUrl: null,
      mapsUrl: "https://maps.google.com/?q=Athens",
      ownerEmail: "barber@radevu.local",
      ownerPassword: "BarberDev123!",
      photoUrl: null,
      services: [
        {
          durationMinutes: 30,
          name: "Ανδρικό κούρεμα",
          priceCents: 1500
        },
        {
          durationMinutes: 20,
          name: "Γενειάδα",
          priceCents: 800
        },
        {
          durationMinutes: 45,
          name: "Κούρεμα + Γενειάδα",
          priceCents: 2000
        }
      ],
      showOnLanding: false,
      slug: "test-shop",
      socialLinks: {
        facebook: "https://facebook.com",
        instagram: "https://instagram.com"
      },
      timezone: "Europe/Athens",
      workingHours: testShopHours
    },
    {
      businessName: "Δέσποινα - Φιλόλογος",
      contactEmail: "despoina@radevu.test",
      contactPhone: "6900001001",
      logoUrl: null,
      mapsUrl: null,
      ownerEmail: "despoina@radevu.test",
      ownerPassword: demoPassword(
        "SEED_DESPOINA_PASSWORD",
        "DespoinaDev2026!"
      ),
      // Unsplash stable ID verified with HEAD on 2026-05-22.
      photoUrl:
        "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&q=70",
      services: [
        {
          durationMinutes: 60,
          name: "Ιδιαίτερο Γυμνασίου",
          priceCents: 1800
        },
        {
          durationMinutes: 60,
          name: "Ιδιαίτερο Λυκείου",
          priceCents: 2200
        },
        {
          durationMinutes: 90,
          name: "Πανελλήνιες – Έκθεση",
          priceCents: 2800
        },
        {
          durationMinutes: 30,
          name: "Γνωριμία",
          priceCents: 0
        }
      ],
      showOnLanding: true,
      slug: "despoina",
      socialLinks: {},
      timezone: "Europe/Athens",
      workingHours: despoinaHours
    },
    {
      businessName: "Ιωάννης - Τεχνικός δικτύων",
      contactEmail: "ioannis@radevu.test",
      contactPhone: "6900001002",
      logoUrl: null,
      mapsUrl: null,
      ownerEmail: "ioannis@radevu.test",
      ownerPassword: demoPassword("SEED_IOANNIS_PASSWORD", "IoannisDev2026!"),
      // Unsplash stable ID verified with HEAD on 2026-05-22.
      photoUrl:
        "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=70",
      services: [
        {
          durationMinutes: 60,
          name: "Διάγνωση προβλήματος δικτύου",
          priceCents: 3000
        },
        {
          durationMinutes: 90,
          name: "Εγκατάσταση router / switch",
          priceCents: 5000
        },
        {
          durationMinutes: 60,
          name: "Επισκευή WiFi (signal / dead zones)",
          priceCents: 4000
        },
        {
          durationMinutes: 120,
          name: "Setup VPN / firewall",
          priceCents: 8000
        },
        {
          durationMinutes: 90,
          name: "Εγκατάσταση Pi-hole / DNS",
          priceCents: 6000
        }
      ],
      showOnLanding: true,
      slug: "ioannis",
      socialLinks: {},
      timezone: "Europe/Athens",
      workingHours: ioannisHours
    }
  ];
}

async function upsertOwnerWithPassword(
  prisma: PrismaClient,
  auth: Awaited<ReturnType<typeof createSeedAuth>>,
  spec: BusinessSeedSpec
): Promise<string> {
  const context = await auth.$context;
  // Uses better-auth's internal hasher so accounts match real sign-up format.
  const passwordHash = await context.password.hash(spec.ownerPassword);
  const user = await prisma.user.upsert({
    where: {
      email: spec.ownerEmail
    },
    create: {
      email: spec.ownerEmail,
      emailVerified: false,
      name: spec.businessName
    },
    update: {
      name: spec.businessName
    },
    select: {
      id: true
    }
  });
  const accounts = await prisma.account.findMany({
    where: {
      providerId: "credential",
      userId: user.id
    },
    orderBy: {
      createdAt: "asc"
    },
    select: {
      id: true
    }
  });
  const primaryAccount = accounts[0];

  if (primaryAccount) {
    await prisma.account.update({
      where: {
        id: primaryAccount.id
      },
      data: {
        accountId: user.id,
        password: passwordHash
      }
    });

    const duplicateIds = accounts.slice(1).map((account) => account.id);

    if (duplicateIds.length > 0) {
      await prisma.account.deleteMany({
        where: {
          id: {
            in: duplicateIds
          }
        }
      });
    }
  } else {
    await prisma.account.create({
      data: {
        accountId: user.id,
        password: passwordHash,
        providerId: "credential",
        userId: user.id
      }
    });
  }

  return user.id;
}

async function recreateServices(
  prisma: PrismaClient,
  businessId: string,
  services: ServiceSpec[]
): Promise<void> {
  await prisma.service.deleteMany({
    where: {
      businessId
    }
  });

  await prisma.service.createMany({
    data: services.map((service) => ({
      active: true,
      businessId,
      currency: "EUR",
      durationMinutes: service.durationMinutes,
      name: service.name,
      priceCents: service.priceCents
    }))
  });
}

async function syncServicesWithoutDeletingAppointments(
  prisma: PrismaClient,
  businessId: string,
  services: ServiceSpec[]
): Promise<void> {
  const desiredNames = services.map((service) => service.name);

  for (const service of services) {
    const existingService = await prisma.service.findFirst({
      where: {
        businessId,
        name: service.name
      },
      select: {
        id: true
      }
    });

    if (existingService) {
      await prisma.service.update({
        where: {
          id: existingService.id
        },
        data: {
          active: true,
          currency: "EUR",
          durationMinutes: service.durationMinutes,
          priceCents: service.priceCents
        }
      });
    } else {
      await prisma.service.create({
        data: {
          active: true,
          businessId,
          currency: "EUR",
          durationMinutes: service.durationMinutes,
          name: service.name,
          priceCents: service.priceCents
        }
      });
    }
  }

  await prisma.service.updateMany({
    where: {
      businessId,
      name: {
        notIn: desiredNames
      }
    },
    data: {
      active: false
    }
  });
}

async function syncServices(
  prisma: PrismaClient,
  businessId: string,
  services: ServiceSpec[]
): Promise<void> {
  try {
    await recreateServices(prisma, businessId, services);
  } catch (error) {
    const errorSummary =
      error instanceof Error
        ? {
            message: error.message,
            name: error.name
          }
        : {
            message: "Unknown service sync error"
          };

    console.warn("[seed] service recreation skipped; syncing in place", {
      businessId,
      error: errorSummary
    });
    await syncServicesWithoutDeletingAppointments(prisma, businessId, services);
  }
}

async function upsertBusinessWithOwner(
  prisma: PrismaClient,
  auth: Awaited<ReturnType<typeof createSeedAuth>>,
  spec: BusinessSeedSpec
): Promise<void> {
  const ownerId = await upsertOwnerWithPassword(prisma, auth, spec);
  const business = await prisma.business.upsert({
    where: {
      slug: spec.slug
    },
    create: {
      contactEmail: spec.contactEmail,
      contactPhone: spec.contactPhone,
      logoUrl: spec.logoUrl,
      mapsUrl: spec.mapsUrl,
      name: spec.businessName,
      notificationSettings: defaultNotificationSettings,
      ownerId,
      photoUrl: spec.photoUrl,
      showOnLanding: spec.showOnLanding,
      slug: spec.slug,
      socialLinks: spec.socialLinks,
      timezone: spec.timezone,
      workingHours: spec.workingHours
    },
    update: {
      contactEmail: spec.contactEmail,
      contactPhone: spec.contactPhone,
      logoUrl: spec.logoUrl,
      mapsUrl: spec.mapsUrl,
      name: spec.businessName,
      notificationSettings: defaultNotificationSettings,
      ownerId,
      photoUrl: spec.photoUrl,
      showOnLanding: spec.showOnLanding,
      socialLinks: spec.socialLinks,
      timezone: spec.timezone,
      workingHours: spec.workingHours
    },
    select: {
      id: true
    }
  });

  await syncServices(prisma, business.id, spec.services);
}

async function main(): Promise<void> {
  loadEnvFile();
  warnAboutDefaultPasswords();

  const prisma = new PrismaClient();

  try {
    const auth = await createSeedAuth(prisma);

    for (const spec of seedSpecs()) {
      await upsertBusinessWithOwner(prisma, auth, spec);
      console.info("[seed] business ready", {
        slug: spec.slug
      });
    }
  } catch (error) {
    console.error("Failed to seed Radevu development data", {
      error
    });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

await main();
