"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getManagedBusinessForUser } from "@/lib/business-access";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function ownerContext() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const managed = await getManagedBusinessForUser(session.user.id);
  if (!managed || managed.ownerId !== session.user.id) throw new Error("OWNER_ONLY");
  return {
    id: managed.id,
    owner: { email: managed.owner.email ?? session.user.email }
  };
}

export async function addManagerAction(formData: FormData): Promise<void> {
  const business = await ownerContext();
  const email = formString(formData, "email").toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) redirect("/dashboard/settings/managers?error=invalid_email");
  if (email === business.owner.email.toLowerCase()) redirect("/dashboard/settings/managers?error=owner_email");

  let user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  let createdUserId: string | null = null;
  try {
    if (!user) {
      const created = await auth.api.signUpEmail({
        body: {
          email,
          name: email.split("@")[0] || "Διαχειριστής",
          password: randomBytes(32).toString("base64url")
        }
      });
      createdUserId = created.id;
      user = { id: created.id };
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { userType: "business_owner" } }),
      prisma.businessManager.upsert({
        where: { businessId_userId: { businessId: business.id, userId: user.id } },
        create: { businessId: business.id, role: "manager", userId: user.id },
        update: { role: "manager" }
      })
    ]);

    if (createdUserId) {
      await auth.api.forgetPassword({
        body: { email, redirectTo: new URL("/reset-password", env.BETTER_AUTH_URL).toString() }
      });
    }
  } catch (error) {
    if (createdUserId) {
      await prisma.user.delete({ where: { id: createdUserId } }).catch(() => undefined);
    }
    console.error("Failed to add business manager", { businessId: business.id, email, error });
    redirect("/dashboard/settings/managers?error=failed");
  }

  revalidatePath("/dashboard/settings/managers");
  redirect(`/dashboard/settings/managers?added=${encodeURIComponent(email)}`);
}

export async function removeManagerAction(formData: FormData): Promise<void> {
  const business = await ownerContext();
  const managerId = formString(formData, "manager_id");
  await prisma.businessManager.deleteMany({ where: { businessId: business.id, id: managerId } });
  revalidatePath("/dashboard/settings/managers");
  redirect("/dashboard/settings/managers?removed=1");
}
