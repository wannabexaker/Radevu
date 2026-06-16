import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { sendEmailVerification } from "@radevu/email";
import { prisma } from "@/lib/db";
import { getResendEmailConfig } from "@/lib/email-config";
import { env } from "@/lib/env";

const tokenTtlMs = 24 * 60 * 60_000;
const identifierPrefix = "email-verification";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");

  return left.length === right.length && timingSafeEqual(left, right);
}

function identifier(email: string): string {
  return `${identifierPrefix}:${email.trim().toLowerCase()}`;
}

export function emailVerificationUrl(email: string, token: string): string {
  const url = new URL("/verify-email", env.BETTER_AUTH_URL);
  url.searchParams.set("email", email);
  url.searchParams.set("token", token);
  return url.toString();
}

export async function createEmailVerificationToken(input: {
  email: string;
  userId: string;
}): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const tokenIdentifier = identifier(input.email);

  await prisma.verification.deleteMany({
    where: {
      identifier: tokenIdentifier
    }
  });

  await prisma.verification.create({
    data: {
      expiresAt: new Date(Date.now() + tokenTtlMs),
      identifier: tokenIdentifier,
      value: `${input.userId}:${hashToken(token)}`
    }
  });

  return token;
}

export async function sendVerificationEmail(input: {
  email: string;
  name: string;
  token: string;
}): Promise<void> {
  const config = getResendEmailConfig("Email verification");

  if (!config) {
    return;
  }

  await sendEmailVerification({
    ...config,
    name: input.name,
    to: input.email,
    verificationUrl: emailVerificationUrl(input.email, input.token)
  });
}

export async function verifyEmailToken(input: {
  email: string;
  token: string;
}): Promise<{ ok: true } | { ok: false; reason: "invalid" | "expired" }> {
  const tokenIdentifier = identifier(input.email);
  const verification = await prisma.verification.findFirst({
    orderBy: {
      createdAt: "desc"
    },
    where: {
      identifier: tokenIdentifier
    }
  });

  if (!verification) {
    return {
      ok: false,
      reason: "invalid"
    };
  }

  if (verification.expiresAt.getTime() < Date.now()) {
    await prisma.verification.delete({
      where: {
        id: verification.id
      }
    });
    return {
      ok: false,
      reason: "expired"
    };
  }

  const [userId, tokenHash] = verification.value.split(":");

  if (!userId || !tokenHash || !safeEqualHex(tokenHash, hashToken(input.token))) {
    return {
      ok: false,
      reason: "invalid"
    };
  }

  await prisma.$transaction([
    prisma.user.update({
      data: {
        emailVerified: true
      },
      where: {
        id: userId
      }
    }),
    prisma.customer.updateMany({
      data: {
        userId
      },
      where: {
        email: {
          equals: input.email.trim().toLowerCase(),
          mode: "insensitive"
        },
        userId: null
      }
    }),
    prisma.verification.deleteMany({
      where: {
        identifier: tokenIdentifier
      }
    })
  ]);

  return {
    ok: true
  };
}
