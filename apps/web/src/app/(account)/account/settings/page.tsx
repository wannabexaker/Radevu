import { redirect } from "next/navigation";
import { ChangeEmailForm } from "@/components/account/ChangeEmailForm";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentUser } from "@/lib/current-user";
import { saveAccountSettings } from "./actions";

type AccountSettingsPageProps = {
  searchParams: Promise<{
    saved?: string;
  }>;
};

export default async function AccountSettingsPage({
  searchParams
}: AccountSettingsPageProps): Promise<JSX.Element> {
  const user = await getCurrentUser();
  const { saved } = await searchParams;

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-950">Προφίλ</h1>
        <p className="text-sm leading-relaxed text-slate-600">
          Τα στοιχεία αυτά χρησιμοποιούνται για να συμπληρώνεται πιο γρήγορα η
          κράτηση.
        </p>
      </header>

      {saved ? (
        <p className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
          Οι αλλαγές αποθηκεύτηκαν.
        </p>
      ) : null}

      <form
        action={saveAccountSettings}
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="space-y-2">
          <Label htmlFor="name">Ονοματεπώνυμο</Label>
          <Input
            defaultValue={user?.name ?? ""}
            id="name"
            minLength={2}
            name="name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            disabled
            id="email"
            name="email"
            type="email"
            value={user?.email ?? ""}
          />
          <p className="text-xs text-slate-500">
            Το Email σύνδεσης δεν αλλάζει από εδώ.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Τηλέφωνο</Label>
          <Input
            defaultValue={user?.phone ?? ""}
            id="phone"
            inputMode="tel"
            name="phone"
            type="tel"
          />
        </div>

        <label className="flex items-start gap-3 text-sm leading-6 text-slate-600">
          <input
            className="mt-1 h-4 w-4"
            defaultChecked={user?.marketingOptIn ?? false}
            name="marketing_opt_in"
            type="checkbox"
          />
          Να λαμβάνω ενημερώσεις για το Radevu.
        </label>

        <Button className="w-full" type="submit">
          Αποθήκευση
        </Button>
      </form>

      <ChangeEmailForm
        currentEmail={user.email}
        emailVerified={user.emailVerified}
      />
      <ChangePasswordForm />
    </div>
  );
}
