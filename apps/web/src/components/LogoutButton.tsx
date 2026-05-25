"use client";

import { createAuthClient } from "better-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const authClient = createAuthClient();

export function LogoutButton(): JSX.Element {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleLogout(): Promise<void> {
    setError(null);
    setIsPending(true);

    try {
      const result = await authClient.signOut();

      if (result.error) {
        console.error("better-auth sign-out returned an error", result.error);
        setError("Η αποσύνδεση απέτυχε.");
        return;
      }

      router.push("/dashboard/login");
      router.refresh();
    } catch (logoutError) {
      console.error("Failed to sign out", logoutError);
      setError("Η αποσύνδεση απέτυχε.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        className="min-h-11 rounded-md border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-800 active:bg-neutral-100 disabled:opacity-60"
        disabled={isPending}
        onClick={handleLogout}
        type="button"
      >
        Αποσύνδεση
      </button>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
