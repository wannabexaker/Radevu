import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

// DEV / OPS maintenance tool — NOT part of the Radevu app, never imported by it.
// Rotates the seeded business-owner LOGIN passwords in whatever database
// DATABASE_URL points to. Targets owners by business slug, so it behaves the
// same on a local or production database regardless of each owner's email.
// Touches ONLY passwords (the credential account row) — never businesses,
// services, customers or appointments.
//
//   Local:  DATABASE_URL="postgresql://radevu:radevu_dev_password@localhost:5433/radevu?schema=public" \
//             node scripts/set-passwords.mjs
//   Pi:     (run inside the compose network — see docs/ops/rotate-owner-passwords.md)
//
// For each owner it uses SEED_<NAME>_PASSWORD from the environment if set,
// otherwise it generates a strong random password. The list is printed once.

// Load infra/.env for convenience (DATABASE_URL + SEED_*_PASSWORD), but never
// override anything already provided in the real environment.
const envUrl = new URL("../infra/.env", import.meta.url);
if (existsSync(envUrl)) {
  for (const line of readFileSync(envUrl, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }
    const separator = trimmed.indexOf("=");
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

if (!process.env.DATABASE_URL) {
  console.error("[set-passwords] DATABASE_URL is not set. See docs/ops/rotate-owner-passwords.md");
  process.exit(1);
}

const dbRequire = createRequire(new URL("../packages/db/package.json", import.meta.url));
const webRequire = createRequire(new URL("../apps/web/package.json", import.meta.url));
const { PrismaClient } = await import(
  pathToFileURL(dbRequire.resolve("@prisma/client")).href
);
const { betterAuth } = await import(
  pathToFileURL(webRequire.resolve("better-auth")).href
);
const { prismaAdapter } = await import(
  pathToFileURL(webRequire.resolve("better-auth/adapters/prisma")).href
);

const owners = [
  { envKey: "SEED_DESPOINA_PASSWORD", slug: "despoina" },
  { envKey: "SEED_IOANNIS_PASSWORD", slug: "ioannis" },
  { envKey: "SEED_ANTONIS_PASSWORD", slug: "antonis" },
  { envKey: "SEED_MATINA_PASSWORD", slug: "matina" },
  { envKey: "SEED_AGGELIKI_PASSWORD", slug: "aggeliki" },
  { envKey: "SEED_ELENI_PASSWORD", slug: "eleni" }
];

function strongPassword() {
  return randomBytes(18).toString("base64url");
}

const prisma = new PrismaClient();
const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { autoSignIn: false, enabled: true },
  secret:
    process.env.BETTER_AUTH_SECRET ?? "seed_secret_for_local_development_only"
});

const results = [];
try {
  const context = await auth.$context;

  for (const { envKey, slug } of owners) {
    const business = await prisma.business.findUnique({
      select: { owner: { select: { email: true, id: true } } },
      where: { slug }
    });
    if (!business?.owner) {
      console.warn(`[set-passwords] skip "${slug}" — business/owner not found`);
      continue;
    }

    const fromEnv = process.env[envKey]?.trim();
    const password = fromEnv ? fromEnv : strongPassword();
    const source = fromEnv ? `env ${envKey}` : "generated";
    const passwordHash = await context.password.hash(password);

    const updated = await prisma.account.updateMany({
      data: { password: passwordHash },
      where: { providerId: "credential", userId: business.owner.id }
    });
    if (updated.count === 0) {
      await prisma.account.create({
        data: {
          accountId: business.owner.id,
          password: passwordHash,
          providerId: "credential",
          userId: business.owner.id
        }
      });
    }

    results.push({ email: business.owner.email, password, slug, source });
  }

  console.info("\n=== New owner passwords — SAVE THESE (shown once) ===");
  for (const row of results) {
    console.info(
      `${row.slug.padEnd(10)} ${row.email.padEnd(36)} ${row.password}   (${row.source})`
    );
  }
  console.info(
    "\nTip: copy these into infra/.env as SEED_*_PASSWORD so the seed keeps them.\n"
  );
} finally {
  await prisma.$disconnect();
}
