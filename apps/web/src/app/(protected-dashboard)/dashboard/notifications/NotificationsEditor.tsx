"use client";

import type { FormEvent } from "react";
import { Bell, MailCheck } from "lucide-react";
import type { NotificationSettingsDTO } from "@radevu/shared";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LeadTimePicker } from "@/components/settings/LeadTimePicker";
import { ToastInline } from "@/components/settings/ToastInline";
import type { NotificationSettingsActionResult } from "./actions";

type NotificationsEditorProps = {
  initialSettings: NotificationSettingsDTO;
  saveNotificationSettingsAction: (
    formData: FormData
  ) => Promise<NotificationSettingsActionResult>;
};

/**
 * Renders the owner notification settings editor.
 *
 * @param props - Initial notification settings and save server action.
 * @returns A mobile-first notifications settings form.
 */
export function NotificationsEditor({
  initialSettings,
  saveNotificationSettingsAction
}: NotificationsEditorProps): JSX.Element {
  const [confirmationEnabled, setConfirmationEnabled] = useState(
    initialSettings.confirmation_enabled
  );
  const [reminderEnabled, setReminderEnabled] = useState(
    initialSettings.reminder_enabled
  );
  const [reminderLeadMinutes, setReminderLeadMinutes] = useState(
    initialSettings.reminder_lead_minutes
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = window.setTimeout(() => setSuccess(null), 2000);
    return () => window.clearTimeout(timer);
  }, [success]);

  function submitSettings(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const formData = new FormData();
    formData.set("confirmation_enabled", String(confirmationEnabled));
    formData.set("reminder_enabled", String(reminderEnabled));
    formData.set("reminder_lead_minutes", String(reminderLeadMinutes));

    startTransition(async () => {
      const result = await saveNotificationSettingsAction(formData);

      if (!result.ok) {
        setError(result.error);
        setSuccess(null);
        return;
      }

      setError(null);
      setSuccess("Αποθηκεύτηκε");
    });
  }

  return (
    <form className="flex flex-col gap-6 pb-20" onSubmit={submitSettings}>
      <header className="space-y-2">
        <h1 className="text-3xl font-bold leading-tight text-slate-900">
          Ειδοποιήσεις
        </h1>
        <p className="text-base leading-relaxed text-slate-500">
          Διάλεξε ποια Email στέλνονται αυτόματα στους πελάτες σου.
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-start gap-3">
          <MailCheck aria-hidden="true" className="mt-1 h-5 w-5 text-indigo-500" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Email επιβεβαίωσης μετά την κράτηση
                </h2>
              </div>
              <Switch
                aria-label="Email επιβεβαίωσης μετά την κράτηση"
                checked={confirmationEnabled}
                data-testid="notifications-confirmation-switch"
                onCheckedChange={setConfirmationEnabled}
              />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              Στέλνεται στον πελάτη αμέσως μετά την κράτηση, μαζί με αρχείο
              ημερολογίου.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-start gap-3">
          <Bell aria-hidden="true" className="mt-1 h-5 w-5 text-indigo-500" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Υπενθύμιση πριν την κράτηση
                </h2>
              </div>
              <Switch
                aria-label="Υπενθύμιση πριν την κράτηση"
                checked={reminderEnabled}
                data-testid="notifications-reminder-switch"
                onCheckedChange={setReminderEnabled}
              />
            </div>
            {reminderEnabled ? (
              <div className="mt-4 space-y-3">
                <LeadTimePicker
                  name="reminder_lead_minutes"
                  onChange={setReminderLeadMinutes}
                  value={reminderLeadMinutes}
                />
                <p className="text-sm leading-relaxed text-slate-500">
                  Η υπενθύμιση φεύγει αυτόματα πριν την ώρα της κράτησης. Αν ο
                  πελάτης δεν έχει Email, δεν στέλνεται τίποτα.
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                Δεν θα σταλεί αυτόματο Email υπενθύμισης στον πελάτη.
              </p>
            )}
          </div>
        </div>
      </section>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      {success ? <ToastInline message={success} /> : null}

      <div className="sticky bottom-20 z-10 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <Button
          className="w-full"
          data-testid="notifications-save"
          disabled={isPending}
          type="submit"
        >
          Αποθήκευση
        </Button>
      </div>
    </form>
  );
}
