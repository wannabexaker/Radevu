"use client";

import { BUSINESS_CATEGORIES } from "@radevu/shared";
import {
  AlignLeft,
  Building2,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Tag
} from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploadField } from "@/components/settings/ImageUploadField";
import { ToastInline } from "@/components/settings/ToastInline";
import type {
  SettingsActionResult,
  UploadActionResult
} from "./actions";

type BusinessProfileSettings = {
  category: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  description: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  logoUrl: string | null;
  mapsUrl: string | null;
  name: string;
  photoUrl: string | null;
};

type ProfileEditorProps = {
  business: BusinessProfileSettings;
  removeLogoAction: () => Promise<SettingsActionResult>;
  removePhotoAction: () => Promise<SettingsActionResult>;
  saveProfileAction: (formData: FormData) => Promise<SettingsActionResult>;
  uploadLogoAction: (formData: FormData) => Promise<UploadActionResult>;
  uploadPhotoAction: (formData: FormData) => Promise<UploadActionResult>;
};

/**
 * Renders the owner profile editor for public business details.
 *
 * @param props - Business data and server actions for saving profile changes.
 * @returns The profile settings form.
 */
export function ProfileEditor({
  business,
  removeLogoAction,
  removePhotoAction,
  saveProfileAction,
  uploadLogoAction,
  uploadPhotoAction
}: ProfileEditorProps): JSX.Element {
  const [logoUrl, setLogoUrl] = useState<string | null>(business.logoUrl);
  const [photoUrl, setPhotoUrl] = useState<string | null>(business.photoUrl);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = window.setTimeout(() => setSuccess(null), 2200);
    return () => window.clearTimeout(timer);
  }, [success]);

  function submitProfile(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await saveProfileAction(formData);

      if (!result.ok) {
        setError(result.error);
        setSuccess(null);
        return;
      }

      setError(null);
      setSuccess("Οι αλλαγές αποθηκεύτηκαν.");
    });
  }

  return (
    <div className="space-y-5 pb-20">
      <header className="space-y-2">
        <p className="text-sm font-medium text-indigo-700">Ρυθμίσεις</p>
        <h1 className="text-2xl font-semibold text-slate-950">Προφίλ</h1>
        <p className="text-sm leading-relaxed text-slate-600">
          Ενημέρωσε τα στοιχεία που βλέπουν οι πελάτες σου πριν κάνουν κράτηση.
        </p>
      </header>

      <div className="grid gap-4">
        <ImageUploadField
          aspectHint="Τετράγωνη εικόνα για την κεφαλίδα της επιχείρησης."
          currentUrl={logoUrl}
          inputTestId="logo-file-input"
          kind="logo"
          label="Λογότυπο"
          onChange={setLogoUrl}
          removeAction={removeLogoAction}
          removeButtonTestId="logo-remove-button"
          uploadAction={uploadLogoAction}
          uploadButtonTestId="logo-upload-button"
        />
        <ImageUploadField
          aspectHint="Οριζόντια φωτογραφία για το πάνω μέρος του δημόσιου προφίλ."
          currentUrl={photoUrl}
          inputTestId="photo-file-input"
          kind="photo"
          label="Φωτογραφία προφίλ"
          onChange={setPhotoUrl}
          removeAction={removePhotoAction}
          removeButtonTestId="photo-remove-button"
          uploadAction={uploadPhotoAction}
          uploadButtonTestId="photo-upload-button"
        />
      </div>

      <form className="space-y-4" onSubmit={submitProfile}>
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Στοιχεία επιχείρησης
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                Κράτησέ τα καθαρά και σύντομα.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2" htmlFor="name">
                <Building2 aria-hidden="true" className="h-4 w-4" />
                Όνομα επιχείρησης
              </Label>
              <Input
                data-testid="settings-profile-name"
                defaultValue={business.name}
                id="name"
                name="name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2" htmlFor="category">
                <Tag aria-hidden="true" className="h-4 w-4" />
                Κατηγορία
              </Label>
              <select
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                data-testid="settings-profile-category"
                defaultValue={business.category ?? ""}
                id="category"
                name="category"
              >
                <option disabled value="">
                  Διάλεξε κατηγορία
                </option>
                {BUSINESS_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2" htmlFor="description">
                <AlignLeft aria-hidden="true" className="h-4 w-4" />
                Περιγραφή
              </Label>
              <textarea
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                data-testid="settings-profile-description"
                defaultValue={business.description ?? ""}
                id="description"
                maxLength={600}
                name="description"
                placeholder="Πες σύντομα στους πελάτες τι κάνεις."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2" htmlFor="contact_phone">
                <Phone aria-hidden="true" className="h-4 w-4" />
                Τηλέφωνο
              </Label>
              <Input
                data-testid="settings-profile-phone"
                defaultValue={business.contactPhone ?? ""}
                id="contact_phone"
                inputMode="tel"
                name="contact_phone"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2" htmlFor="contact_email">
                <Mail aria-hidden="true" className="h-4 w-4" />
                Email
              </Label>
              <Input
                data-testid="settings-profile-email"
                defaultValue={business.contactEmail ?? ""}
                id="contact_email"
                name="contact_email"
                type="email"
              />
              <p className="text-xs leading-5 text-slate-500">
                Αυτό είναι το δημόσιο email επικοινωνίας της επιχείρησης. Δεν
                αλλάζει το email σύνδεσης.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Σύνδεσμοι
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                Πρόσθεσε μόνο τους συνδέσμους που χρησιμοποιείς.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2" htmlFor="maps_url">
                <MapPin aria-hidden="true" className="h-4 w-4" />
                Χάρτης
              </Label>
              <Input
                data-testid="settings-profile-maps"
                defaultValue={business.mapsUrl ?? ""}
                id="maps_url"
                name="maps_url"
                placeholder="https://..."
                type="url"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2" htmlFor="instagram_url">
                <Instagram aria-hidden="true" className="h-4 w-4" />
                Σύνδεσμος φωτογραφιών
              </Label>
              <Input
                data-testid="settings-profile-instagram"
                defaultValue={business.instagramUrl ?? ""}
                id="instagram_url"
                name="instagram_url"
                placeholder="https://..."
                type="url"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2" htmlFor="facebook_url">
                <Facebook aria-hidden="true" className="h-4 w-4" />
                Σύνδεσμος κοινωνικού δικτύου
              </Label>
              <Input
                data-testid="settings-profile-facebook"
                defaultValue={business.facebookUrl ?? ""}
                id="facebook_url"
                name="facebook_url"
                placeholder="https://..."
                type="url"
              />
            </div>
          </div>
        </section>

        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        {success ? <ToastInline message={success} /> : null}

        <div className="sticky bottom-20 z-10 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <Button
            className="w-full"
            data-testid="settings-profile-save"
            disabled={isPending}
            type="submit"
          >
            Αποθήκευση
          </Button>
        </div>
      </form>
    </div>
  );
}
