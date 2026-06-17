"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type AppointmentsFilterDate = {
  date: string;
  label: string;
};

type AppointmentsFiltersProps = {
  dates: AppointmentsFilterDate[];
  query: string;
  selectedDate: string | null;
  view: "upcoming" | "past";
};

/**
 * Renders URL-driven dashboard filters for appointment date, search, and history view.
 *
 * @param props - Current filter state and server-built date strip options.
 * @returns Client controls that update the appointments URL.
 */
export function AppointmentsFilters({
  dates,
  query,
  selectedDate,
  view
}: AppointmentsFiltersProps): JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(query);

  function pushParams(updates: Record<string, string | null>): void {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value.length === 0) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    params.delete("cursor");
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  }

  useEffect(() => {
    setSearch(query);
  }, [query]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (search !== query) {
        pushParams({
          q: search.trim().length > 0 ? search.trim() : null
        });
      }
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [search, query]);

  return (
    <section className="sticky top-0 z-20 -mx-4 flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
          />
          <Input
            aria-label="Αναζήτηση πελάτη"
            className="pl-9"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Όνομα, Email, τηλέφωνο"
            value={search}
          />
        </div>
        <Button
          className="shrink-0 px-3 text-xs"
          onClick={() =>
            pushParams({
              view: view === "past" ? "upcoming" : "past"
            })
          }
          type="button"
          variant="outline"
        >
          {view === "past" ? "Επόμενα" : "Παλιά"}
        </Button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Button
          className="shrink-0 px-4 text-sm"
          onClick={() => pushParams({ date: null })}
          type="button"
          variant={selectedDate ? "outline" : "default"}
        >
          Όλα
        </Button>
        {dates.map((date) => (
          <Button
            className="shrink-0 px-4 text-sm"
            key={date.date}
            onClick={() => pushParams({ date: date.date })}
            type="button"
            variant={selectedDate === date.date ? "default" : "outline"}
          >
            {date.label}
          </Button>
        ))}
      </div>
    </section>
  );
}
