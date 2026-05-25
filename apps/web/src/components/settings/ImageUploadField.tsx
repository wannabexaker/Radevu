"use client";

import { Image as ImageIcon, Trash2, Upload } from "lucide-react";
import { useEffect, useId, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ToastInline } from "@/components/settings/ToastInline";

type UploadResult =
  | {
      ok: true;
      url: string;
    }
  | {
      ok: false;
      error: string;
    };

type RemoveResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: string;
    };

type ImageUploadFieldProps = {
  aspectHint: string;
  currentUrl: string | null;
  inputTestId?: string;
  kind: "logo" | "photo";
  label: string;
  onChange: (url: string | null) => void;
  removeButtonTestId?: string;
  removeAction: () => Promise<RemoveResult>;
  uploadButtonTestId?: string;
  uploadAction: (formData: FormData) => Promise<UploadResult>;
};

const maxFileSizeBytes = 5 * 1024 * 1024;

/**
 * Renders a native file input with image preview and save/remove actions.
 *
 * @param props - Field labels, current URL, and server actions for upload/removal.
 * @returns A mobile-friendly image upload control.
 */
export function ImageUploadField({
  aspectHint,
  currentUrl,
  inputTestId,
  kind,
  label,
  onChange,
  removeButtonTestId,
  removeAction,
  uploadButtonTestId,
  uploadAction
}: ImageUploadFieldProps): JSX.Element {
  const inputId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!file) {
      setPreviewUrl(currentUrl);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [currentUrl, file]);

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = window.setTimeout(() => setSuccess(null), 2000);
    return () => window.clearTimeout(timer);
  }, [success]);

  function onFileChange(nextFile: File | null): void {
    setError(null);
    setSuccess(null);
    setFile(nextFile);

    if (nextFile && nextFile.size > maxFileSizeBytes) {
      setError("Η εικόνα πρέπει να είναι έως 5MB.");
    }
  }

  function uploadSelectedFile(): void {
    if (!file) {
      setError("Διάλεξε πρώτα εικόνα.");
      return;
    }

    if (file.size > maxFileSizeBytes) {
      setError("Η εικόνα πρέπει να είναι έως 5MB.");
      return;
    }

    const formData = new FormData();
    formData.set("kind", kind);
    formData.set("file", file);

    startTransition(async () => {
      const result = await uploadAction(formData);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setFile(null);
      onChange(result.url);
      setError(null);
      setSuccess("Αποθηκεύτηκε");
    });
  }

  function removeImage(): void {
    startTransition(async () => {
      const result = await removeAction();

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setFile(null);
      onChange(null);
      setError(null);
      setSuccess("Αποθηκεύτηκε");
    });
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{label}</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            {aspectHint}
          </p>
        </div>

        <div className="flex min-h-32 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {previewUrl ? (
            <img
              alt={label}
              className="h-full max-h-48 w-full object-cover"
              src={previewUrl}
            />
          ) : (
            <ImageIcon aria-hidden="true" className="h-10 w-10 text-slate-400" />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-800 transition-colors active:bg-slate-100 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2"
            htmlFor={inputId}
          >
            <Upload aria-hidden="true" className="h-5 w-5" />
            Διάλεξε εικόνα
          </label>
          <input
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            data-testid={inputTestId}
            id={inputId}
            onChange={(event) =>
              onFileChange(event.currentTarget.files?.item(0) ?? null)
            }
            type="file"
          />
          <Button
            data-testid={uploadButtonTestId}
            disabled={isPending || !file}
            onClick={uploadSelectedFile}
            type="button"
          >
            Αποθήκευση
          </Button>
          {currentUrl ? (
            <Button
              data-testid={removeButtonTestId}
              disabled={isPending}
              onClick={removeImage}
              type="button"
              variant="outline"
            >
              <Trash2 aria-hidden="true" className="h-5 w-5" />
              {kind === "logo" ? "Αφαίρεση λογότυπου" : "Αφαίρεση φωτογραφίας"}
            </Button>
          ) : null}
        </div>

        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        {success ? <ToastInline message={success} /> : null}
      </div>
    </section>
  );
}
