import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { LoginForm } from "./LoginForm";

export default async function LoginPage(): Promise<JSX.Element> {
  const user = await getCurrentUser();

  if (user?.userType === "business_owner") {
    redirect("/dashboard/today");
  }

  if (user?.userType === "customer") {
    redirect("/account");
  }

  return <LoginForm />;
}
