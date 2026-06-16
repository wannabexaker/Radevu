import { redirect } from "next/navigation";

export default function LegacyDashboardLoginPage(): never {
  redirect("/login");
}
