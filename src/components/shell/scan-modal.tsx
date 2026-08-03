"use client";

import { useEffect, useRef } from "react";
import { scanLookup } from "@/lib/customers/actions";
import { btnPrimary, input } from "@/lib/ui";

/**
 * The global scan dialog.
 *
 * When open, the barcode field is focused so a USB scanner (which types the
 * code and presses Enter) submits immediately. The same field also accepts a
 * code typed by hand. On submit, scanLookup decides where to go: straight to
 * the customer if the card is known, or to the new-or-existing decision if not.
 */
export function ScanModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;

    inputRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/40 px-4 pt-28 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Scan a loyalty card"
        className="w-full max-w-md rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
          Scan a card
        </h2>
        <p className="mt-1 text-sm text-muted">
          Scan the customer&apos;s card, or type the barcode and press Enter.
        </p>

        <form action={scanLookup} className="mt-5 flex flex-col gap-3">
          <input
            ref={inputRef}
            name="barcode"
            type="text"
            autoComplete="off"
            placeholder="Waiting for scan..."
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
            <button type="submit" className={btnPrimary}>
              Look up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
