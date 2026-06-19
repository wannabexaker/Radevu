import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/auth";
import { getOwnerBusiness } from "@/lib/dashboard-server";
import { prisma } from "@/lib/db";
import { addManagerAction, removeManagerAction } from "./actions";

type Props = { searchParams: Promise<{ added?: string; error?: string; removed?: string }> };

const errors: Record<string, string> = {
  failed: "Δεν μπορέσαμε να προσθέσουμε τον διαχειριστή.",
  invalid_email: "Γράψε ένα έγκυρο email.",
  owner_email: "Αυτό είναι ήδη το email του ιδιοκτήτη."
};

export default async function ManagersPage({ searchParams }: Props): Promise<JSX.Element> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const managed = await getOwnerBusiness();
  if (!managed || managed.ownerId !== session.user.id) redirect("/dashboard/settings");
  const business = await prisma.business.findUnique({
    where: { id: managed.id },
    select: {
      managers: {
        orderBy: { createdAt: "asc" },
        select: { createdAt: true, id: true, role: true, user: { select: { email: true, name: true } } }
      },
      name: true
    }
  });
  if (!business) redirect("/dashboard/settings");
  const params = await searchParams;

  return (
    <section className="flex flex-col gap-6 pb-20">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Διαχειριστές</h1>
        <p className="mt-2 text-base leading-relaxed text-slate-500">Πρόσθεσε έναν δεύτερο λογαριασμό που θα διαχειρίζεται το {business.name}.</p>
      </header>
      {params.added ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">Ο διαχειριστής {params.added} προστέθηκε.</p> : null}
      {params.removed ? <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">Ο διαχειριστής αφαιρέθηκε.</p> : null}
      {params.error ? <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">{errors[params.error] ?? errors.failed}</p> : null}

      <form action={addManagerAction} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="text-sm font-medium text-slate-800" htmlFor="manager-email">Email διαχειριστή</label>
        <Input className="mt-2 min-h-12" id="manager-email" name="email" placeholder="manager@example.gr" required type="email" />
        <p className="mt-2 text-sm leading-relaxed text-slate-500">Αν δεν υπάρχει λογαριασμός, θα δημιουργηθεί και θα σταλεί email για ορισμό κωδικού.</p>
        <Button className="mt-4 min-h-12 w-full" type="submit">Προσθήκη διαχειριστή</Button>
      </form>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900">Συνδεδεμένοι διαχειριστές</h2>
        {business.managers.length === 0 ? <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">Δεν έχει προστεθεί δεύτερος διαχειριστής.</p> : business.managers.map((manager) => (
          <article className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4" key={manager.id}>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-slate-900">{manager.user.name || "Διαχειριστής"}</p>
              <p className="truncate text-sm text-slate-500">{manager.user.email}</p>
            </div>
            <form action={removeManagerAction}>
              <input name="manager_id" type="hidden" value={manager.id} />
              <Button className="min-h-11" type="submit" variant="outline">Αφαίρεση</Button>
            </form>
          </article>
        ))}
      </section>
    </section>
  );
}
