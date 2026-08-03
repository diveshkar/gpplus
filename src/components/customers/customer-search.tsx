"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { input } from "@/lib/ui";

/**
 * Live customer search. Updates the URL query as the admin types (debounced),
 * so the server-rendered list re-runs the search. Works by name, phone, or a
 * scanned barcode.
 *
 * `basePath` and `extraParams` let the same control drive both the main
 * customer list and the lost-card link screen (which must keep its barcode in
 * the URL while searching).
 */
export function CustomerSearch({
  initialQuery,
  basePath = "/customers",
  extraParams,
  placeholder = "Search by name, phone, or scan a card",
}: {
  initialQuery: string;
  basePath?: string;
  extraParams?: Record<string, string>;
  placeholder?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();
  const firstRender = useRef(true);

  useEffect(() => {
    // Do not re-push on mount; only react to the admin typing.
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const handle = setTimeout(() => {
      const params = new URLSearchParams(extraParams);
      if (value.trim()) params.set("q", value.trim());
      startTransition(() => {
        router.replace(`${basePath}${params.size ? `?${params}` : ""}`);
      });
    }, 250);

    return () => clearTimeout(handle);
  }, [value, router, basePath, extraParams]);

  return (
    <div className="relative">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
        aria-hidden
      >
        <path
          d="m21 21-4.3-4.3M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label="Search customers"
        className={`${input} pl-11`}
      />
      {isPending ? (
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted">
          Searching
        </span>
      ) : null}
    </div>
  );
}
