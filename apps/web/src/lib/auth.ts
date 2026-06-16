import { sendResetPasswordEmail } from "@radevu/email";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";
import { getResendEmailConfig } from "./email-config";
import { env } from "./env";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
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
  trustedOrigins: [env.BETTER_AUTH_URL]
});

export type Auth = typeof auth;
