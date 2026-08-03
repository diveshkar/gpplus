"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { scanBarcode } from "@/lib/transactions/actions";
import { EarnForm, type PaintTypeOption } from "@/components/transactions/earn-form";
import { formatPoints } from "@/lib/format";
import { btnPrimary, input } from "@/lib/ui";
import type { ScannedCustomer } from "@/lib/transactions/actions";

/**
 * The global scan dialog, in two steps.
 *
 * Step 1: the barcode field is focused so a USB scanner (which types the code
 * and presses Enter) submits immediately. A known card moves to step 2. An
 * unknown card routes to the new-or-existing decision.
 *
 * Step 2: the quick Earn form for that customer, so a sale is logged in one go
 * without leaving the current screen.
 */
/**
 * Rendered only while open (mounted fresh each time), so its step resets
 * naturally without a state-resetting effect.
 */
export function ScanModal({
  onClose,
  paintTypes,
}: {
  onClose: () => void;
  paintTypes: PaintTypeOption[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [found, setFound] = useState<ScannedCustomer | null>(null);

  // On open: focus the field and listen for Escape to close.
  useEffect(() => {
    inputRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function handleScan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = inputRef.current?.value.trim() ?? "";
    if (!value) return;

    startTransition(async () => {
      const result = await scanBarcode(value);
      if (result.status === "found") {
        setFound(result.customer);
      } else if (result.status === "unknown") {
        onClose();
        router.push(`/scan/unknown?barcode=${encodeURIComponent(result.barcode)}`);
      }
    });
  }

  function backToScan() {
    setFound(null);
    // Focus back on the field for the next scan.
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/40 px-4 pt-20 backdrop-blur-sm sm:pt-28"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={found ? "Log a transaction" : "Scan a loyalty card"}
        className="w-full max-w-md rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        {found ? (
          <>
            <div className="mb-5">
              <p className="text-xs text-muted">Logging points for</p>
              <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
                {found.full_name}
              </h2>
              <p className="text-sm text-muted">
                Balance {formatPoints(found.points_balance)} points
              </p>
            </div>
            <EarnForm
              customerId={found.id}
              paintTypes={paintTypes}
              defaultPaintTypeId={found.default_paint_type_id}
              onCancel={backToScan}
            />
          </>
        ) : (
          <>
            <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
              Scan a card
            </h2>
            <p className="mt-1 text-sm text-muted">
              Scan the customer&apos;s card, or type the barcode and press Enter.
            </p>

            <form onSubmit={handleScan} className="mt-5 flex flex-col gap-3">
              <input
                ref={inputRef}
                name="barcode"
                type="text"
                autoComplete="off"
                disabled={pending}
                placeholder={pending ? "Looking up..." : "Waiting for scan..."}
                className={input}
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-11 items-center justify-center rounded-lg px-4 text-sm font-medium text-muted transition-colors hover:text-foreground"
                >
                  Cancel
                </button>
                <button type="submit" disabled={pending} className={btnPrimary}>
                  Look up
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
