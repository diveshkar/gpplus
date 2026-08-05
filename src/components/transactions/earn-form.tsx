"use client";

import Link from "next/link";
import { useState } from "react";
import { useActionState } from "react";
import {
  createEarnTransaction,
  editEarnTransaction,
  type EarnFormState,
} from "@/lib/transactions/actions";
import { formatPoints } from "@/lib/format";
import { btnPrimary, errorAlert, input, label, select } from "@/lib/ui";

export type PaintTypeOption = {
  id: string;
  name: string;
  earning_percentage: number;
};

/**
 * The earn form, shared by the scan popup, the per-customer earn page, and the
 * edit page. The points preview updates live as the amount and paint type
 * change, but the database always recalculates on save, so the preview is only
 * a guide.
 */
export function EarnForm({
  customerId,
  paintTypes,
  defaultPaintTypeId,
  mode = "create",
  transactionId,
  initialAmount = "",
  initialDescription = "",
  onCancel,
  cancelHref,
}: {
  customerId: string;
  paintTypes: PaintTypeOption[];
  defaultPaintTypeId: string | null;
  mode?: "create" | "edit";
  transactionId?: string;
  initialAmount?: string;
  initialDescription?: string;
  onCancel?: () => void;
  cancelHref?: string;
}) {
  const initialState: EarnFormState = {
    error: null,
    values: {
      paint_type_id: defaultPaintTypeId ?? "",
      amount: initialAmount,
      description: initialDescription,
    },
  };
  const action =
    mode === "edit" ? editEarnTransaction : createEarnTransaction;
  const [state, formAction, pending] = useActionState(action, initialState);

  const [paintTypeId, setPaintTypeId] = useState(defaultPaintTypeId ?? "");
  const [amount, setAmount] = useState(initialAmount);

  const selectedType = paintTypes.find((t) => t.id === paintTypeId);
  const numericAmount = Number(amount);
  const previewPoints =
    selectedType && amount && !Number.isNaN(numericAmount) && numericAmount > 0
      ? (numericAmount * selectedType.earning_percentage) / 100
      : 0;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="customer_id" value={customerId} />
      {mode === "edit" && transactionId ? (
        <input type="hidden" name="transaction_id" value={transactionId} />
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="amount" className={label}>
          Amount spent (LKR)
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          required
          autoFocus
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="e.g. 2500"
          className={input}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="paint_type_id" className={label}>
          Category
        </label>
        <div className="relative">
          <select
            id="paint_type_id"
            name="paint_type_id"
            required
            value={paintTypeId}
            onChange={(event) => setPaintTypeId(event.target.value)}
            className={select}
          >
            <option value="" disabled>
              Choose a category
            </option>
            {paintTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name} ({type.earning_percentage}%)
              </option>
            ))}
          </select>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden
          >
            <path
              d="m6 9 6 6 6-6"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="text-xs text-muted">
          Prefilled from the customer&apos;s type. Change it for this one
          transaction if they bought the other type.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className={label}>
          Description
        </label>
        <input
          id="description"
          name="description"
          type="text"
          autoComplete="off"
          defaultValue={state.values.description}
          placeholder="e.g. 4 litres exterior emulsion"
          className={input}
        />
      </div>

      {/* Live preview */}
      <div className="flex items-center justify-between rounded-lg border border-brand-soft bg-brand-soft/50 px-4 py-3">
        <span className="text-sm text-muted">Points to be earned</span>
        <span className="font-heading text-lg font-semibold text-brand-strong">
          {formatPoints(previewPoints)}
        </span>
      </div>

      {state.error ? (
        <p role="alert" className={errorAlert}>
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Saving...
            </>
          ) : (
            <>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4"
                aria-hidden
              >
                <path
                  d="M20 6 9 17l-5-5"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {mode === "edit" ? "Save changes" : "Save transaction"}
            </>
          )}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            Cancel
          </button>
        ) : cancelHref ? (
          <Link
            href={cancelHref}
            className="text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            Cancel
          </Link>
        ) : null}
      </div>
    </form>
  );
}
