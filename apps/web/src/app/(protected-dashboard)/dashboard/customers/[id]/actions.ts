"use server";

import { updateCustomerSchema } from "@radevu/shared";
import { revalidatePath } from "next/cache";
import {
  requireCustomerOwnerScope,
  updateCustomer
} from "@/lib/customers";

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/**
 * Saves minimal CRM notes for an owner-owned customer.
 *
 * @param customerId - Customer id selected from the dashboard.
 * @param formData - Form data containing notes and future recommendation.
 * @returns Resolves after the update and dashboard revalidation complete.
 * @throws Error when validation, ownership, or persistence fails.
 */
export async function saveCustomerNotes(
  customerId: string,
  formData: FormData
): Promise<void> {
  try {
    const parsed = updateCustomerSchema.safeParse({
      notes: formString(formData, "notes"),
      future_recommendation: formString(formData, "future_recommendation")
    });

    if (!parsed.success) {
      throw new Error("Customer notes form data was invalid.");
    }

    const scope = await requireCustomerOwnerScope({ customerId });

    if (!scope.ok) {
      throw new Error(`Customer notes scope check failed: ${scope.code}`);
    }

    await updateCustomer(scope.business.id, customerId, parsed.data);
    revalidatePath("/dashboard/customers");
    revalidatePath(`/dashboard/customers/${customerId}`);
  } catch (error) {
    console.error("Failed to save customer notes from dashboard", {
      customerId,
      error
    });
    throw error;
  }
}
