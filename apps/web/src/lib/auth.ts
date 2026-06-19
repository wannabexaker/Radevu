import {
  sendEmailVerification,
  sendResetPasswordEmail
} from "@radevu/email";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";
import { getResendEmailConfig } from "./email-config";
import { env } from "./env";

async function sendBetterAuthVerificationEmail(input: {
  context: string;
  name: string;
  to: string;
  url: string;
}): Promise<void> {
  const config = getResendEmailConfig(input.context);

  if (!config) {
    return;
  }

  const verificationUrl = new URL(input.url);

  if (!verificationUrl.searchParams.has("callbackURL")) {
    verificationUrl.searchParams.set(
      "callbackURL",
      new URL("/login?email_verified=1", env.BETTER_AUTH_URL).toString()
    );
  }

  await sendEmailVerification({
    ...config,
    name: input.name,
    to: input.to,
    verificationUrl: verificationUrl.toString()
  });
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailVerification: {
    sendVerificationEmail: async ({ url, user }) => {
      await sendBetterAuthVerificationEmail({
        context: "Email verification",
        name: user.name,
        to: user.email,
        url
      });
    }
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ token, user }) => {
      const config = getResendEmailConfig("Password reset");

      if (!config) {
        return;
      }

      const resetUrl = new URL("/reset-password", env.BETTER_AUTH_URL);
      resetUrl.searchParams.set("token", token);

      await sendResetPasswordEmail({
        ...config,
        name: user.name,
        resetUrl: resetUrl.toString(),
        to: user.email
      });
    }
  },
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [env.BETTER_AUTH_URL],
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({ url, user }) => {
        await sendBetterAuthVerificationEmail({
          context: "Login email change",
          name: user.name,
          to: user.email,
          url
        });
      }
    }
  }
});

export type Auth = typeof auth;
