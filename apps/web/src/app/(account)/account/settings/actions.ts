"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function saveAccountSettings(formData: FormData): Promise<void> {
  const user = await getCurrentUser();

  if (!user || user.userType !== "customer") {
    throw new Error("Customer session required.");
  }

  const name = formString(formData, "name");
  const phone = formString(formData, "phone");

  if (name.length < 2 || name.length > 100) {
    throw new Error("Invalid name.");
  }

  if (phone.length > 0 && (phone.length < 5 || phone.length > 20)) {
    throw new Error("Invalid phone.");
  }

  await prisma.user.update({
    data: {
      marketingOptIn: formData.get("marketing_opt_in") === "on",
      name,
      phone: phone.length > 0 ? phone : null
    },
    where: {
      id: user.id
    }
  });

  revalidatePath("/account");
  revalidatePath("/account/settings");
  redirect("/account/settings?saved=1");
}
