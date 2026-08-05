"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { scanBarcode } from "@/lib/transactions/actions";
import { EarnForm, type PaintTypeOption } from "@/components/transactions/earn-form";
import { RedeemForm } from "@/components/transactions/redeem-form";
import { formatPoints } from "@/lib/format";
import { btnPrimary, input } from "@/lib/ui";
import type { ScannedCustomer } from "@/lib/transactions/actions";

type ScanConfig = { redemption_threshold: number; redemption_value: number };

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
  config,
  autoBarcode,
}: {
  onClose: () => void;
  paintTypes: PaintTypeOption[];
  config: ScanConfig;
  autoBarcode?: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [found, setFound] = useState<ScannedCustomer | null>(null);
  const [mode, setMode] = useState<"earn" | "redeem">("earn");
  const autoRan = useRef(false);

  function runLookup(value: string) {
    const code = value.trim();
    if (!code) return;

    startTransition(async () => {
      const result = await scanBarcode(code);
      if (result.status === "found") {
        setFound(result.customer);
      } else if (result.status === "unknown") {
        onClose();
        router.push(`/scan/unknown?barcode=${encodeURIComponent(result.barcode)}`);
      }
    });
  }

  // On open: focus the field and listen for Escape to close.
  useEffect(() => {
    inputRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // When opened by a global scan, look the card up immediately.
  useEffect(() => {
    if (autoBarcode && !autoRan.current) {
      autoRan.current = true;
      runLookup(autoBarcode);
    }
    // runLookup is stable enough for this one-shot effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoBarcode]);

  function handleScan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runLookup(inputRef.current?.value ?? "");
  }

  function backToScan() {
    setFound(null);
    setMode("earn");
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
            <div className="mb-4">
              <p className="text-xs text-muted">Logging for</p>
              <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
                {found.full_name}
              </h2>
              <p className="text-sm text-muted">
                Balance {formatPoints(found.points_balance)} points
              </p>
            </div>

            {/* Earn / Redeem toggle */}
            <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg border border-border bg-background p-1">
              {(["earn", "redeem"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setMode(option)}
                  className={[
                    "rounded-md px-3 py-2 text-sm font-medium capitalize transition-colors",
                    mode === option
                      ? "bg-surface text-foreground shadow-sm"
                      : "text-muted hover:text-foreground",
                  ].join(" ")}
                >
                  {option}
                </button>
              ))}
            </div>

            {mode === "earn" ? (
              <EarnForm
                customerId={found.id}
                paintTypes={paintTypes}
                defaultPaintTypeId={found.default_paint_type_id}
                onCancel={backToScan}
              />
            ) : (
              <RedeemForm
                customerId={found.id}
                balance={found.points_balance}
                threshold={config.redemption_threshold}
                value={config.redemption_value}
                onCancel={backToScan}
              />
            )}
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
