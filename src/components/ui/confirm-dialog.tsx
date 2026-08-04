"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState, useTransition } from "react";
import { btnDanger, btnPrimary, btnSecondary } from "@/lib/ui";

/**
 * A reusable confirmation dialog built on Radix Dialog. Accessible by default:
 * focus is trapped, Escape closes it, and clicking the overlay closes it. Use it
 * only when the user must make a decision (void, logout, redeem). Feedback after
 * an action is handled by toasts, not dialogs.
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
}: {
  trigger: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  onConfirm: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await onConfirm();
      setOpen(false);
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay fixed inset-0 z-50 bg-foreground/50" />
        <Dialog.Content className="dialog-content fixed inset-0 z-50 m-auto h-fit max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-md overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-card focus:outline-none">
          <Dialog.Title className="font-heading text-lg font-semibold tracking-tight text-foreground">
            {title}
          </Dialog.Title>
          {description ? (
            <Dialog.Description className="mt-1.5 text-sm text-muted">
              {description}
            </Dialog.Description>
          ) : null}

          <div className="mt-6 flex items-center justify-end gap-2.5">
            <Dialog.Close asChild>
              <button type="button" className={btnSecondary}>
                {cancelLabel}
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={pending}
              className={variant === "danger" ? btnDanger : btnPrimary}
            >
              {pending ? "Working..." : confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
