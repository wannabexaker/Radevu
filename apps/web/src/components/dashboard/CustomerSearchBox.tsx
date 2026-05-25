"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

type CustomerSearchBoxProps = {
  query: string;
};

/**
 * Renders a URL-driven debounced customer search box.
 *
 * @param props - Current search query from the URL.
 * @returns Search input for customer list filtering.
 */
export function CustomerSearchBox({
  query
}: CustomerSearchBoxProps): JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(query);

  useEffect(() => {
    setSearch(query);
  }, [query]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (search === query) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      const trimmed = search.trim();

      if (trimmed.length > 0) {
        params.set("search", trimmed);
      } else {
        params.delete("search");
      }

      params.delete("cursor");
      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [pathname, query, router, search, searchParams]);

  return (
    <div className="relative">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
      />
      <Input
        aria-label="Αναζήτηση πελάτη"
        className="pl-9"
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Όνομα, email, τηλέφωνο"
        value={search}
      />
    </div>
  );
}
