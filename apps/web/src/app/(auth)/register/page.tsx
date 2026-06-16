import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { RegisterForm } from "./RegisterForm";

export default async function RegisterPage(): Promise<JSX.Element> {
  const user = await getCurrentUser();

  if (user?.userType === "business_owner") {
    redirect("/dashboard/today");
  }

  if (user?.userType === "customer") {
    redirect("/account");
  }

  return <RegisterForm />;
}
