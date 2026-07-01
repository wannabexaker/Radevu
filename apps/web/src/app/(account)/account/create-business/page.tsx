import { redirect } from "next/navigation";
import { getManagedBusinessForUser } from "@/lib/business-access";
import { getCurrentUser } from "@/lib/current-user";
import { createBusinessAction } from "./actions";
import { CreateBusinessForm } from "./CreateBusinessForm";

export const dynamic = "force-dynamic";

export default async function CreateBusinessPage(): Promise<JSX.Element> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (await getManagedBusinessForUser(user.id)) {
    redirect("/dashboard/today");
  }

  return <CreateBusinessForm action={createBusinessAction} />;
}
