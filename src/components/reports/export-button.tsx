"use client";

import { useState } from "react";
import { toast } from "sonner";
import { btnSecondary } from "@/lib/ui";

/**
 * Downloads the Excel export for the selected period. Shows a simple loading
 * state while the file is generated. The shared spinning-logo loading screen
 * arrives in Phase 7 and will replace this spinner.
 */
export function ExportButton({
  year,
  month,
}: {
  year: number;
  month: number;
}) {
  const [pending, setPending] = useState(false);

  async function handleExport() {
    setPending(true);
    try {
      const response = await fetch(`/api/export?year=${year}&month=${month}`);
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `gpplus-export-${year}-${String(month).padStart(2, "0")}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      toast.success("Export downloaded");
    } catch {
      toast.error("Export failed. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={pending}
      className={`${btnSecondary} h-10`}
    >
        {pending ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-4 w-4 animate-spin"
            aria-hidden
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeOpacity="0.25"
            />
            <path
              d="M21 12a9 9 0 0 0-9-9"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-4 w-4"
            aria-hidden
          >
            <path
              d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {pending ? "Preparing..." : "Export"}
    </button>
  );
}
