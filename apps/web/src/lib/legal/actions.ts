"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/current-user";
import {
  clientMetaFromHeaders,
  recordTermsAcceptance
} from "@/lib/legal/terms-acceptance";

/**
 * Records the current user's acceptance of the published legal documents.
 *
 * Used by the in-app prompt shown to accounts that predate the current
 * versions. Only ever writes for the signed-in user, so an acceptance always
 * corresponds to a real action by a real person — acceptances are never
 * backfilled on someone's behalf.
 *
 * @param formData - Submitted form, carrying the ticked acceptance box.
 * @returns Nothing; the surrounding layout re-renders without the prompt.
 */
export async function acceptTermsAction(formData: FormData): Promise<void> {
  // The box is also `required` in the markup; re-checking here keeps the
  // stored `method: "checkbox"` honest even if the form is posted directly.
  if (formData.get("accepted_terms") !== "on") {
    return;
  }

  const user = await getCurrentUser();

  if (!user) {
    return;
  }

  await recordTermsAcceptance({
    context: "reprompt",
    email: user.email,
    meta: clientMetaFromHeaders(await headers()),
    method: "checkbox",
    userId: user.id
  });

  revalidatePath("/", "layout");
}
