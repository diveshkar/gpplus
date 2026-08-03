"use client";

import { useActionState } from "react";
import {
  reassignBarcode,
  type ReassignState,
} from "@/lib/customers/actions";
import { formatPoints } from "@/lib/format";
import { card, errorAlert } from "@/lib/ui";
import type { CustomerWithPaintType } from "@/lib/types";

/**
 * The list of existing customers to move a replacement card onto. Each row is
 * its own small form so the admin picks exactly one. They share one action
 * state, which is fine because only one card is linked at a time.
 */
export function LinkCardList({
  candidates,
  barcode,
}: {
  candidates: CustomerWithPaintType[];
  barcode: string;
}) {
  const initialState: ReassignState = { error: null };
  const [state, formAction, pending] = useActionState(
    reassignBarcode,
    initialState,
  );

  if (candidates.length === 0) {
    return (
      <div className={`${card} px-6 py-12 text-center`}>
        <p className="text-sm font-medium text-foreground">
          No matching customer found
        </p>
        <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
          Search by name, phone number, or date of birth to find the customer
          whose card was replaced.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {state.error ? (
        <p role="alert" className={errorAlert}>
          {state.error}
        </p>
      ) : null}

      <div className={`${card} divide-y divide-border overflow-hidden`}>
        {candidates.map((customer) => (
          <form
            key={customer.id}
            action={formAction}
            className="flex items-center justify-between gap-4 px-4 py-3.5"
          >
            <input type="hidden" name="customer_id" value={customer.id} />
            <input type="hidden" name="barcode_id" value={barcode} />

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {customer.full_name}
              </p>
              <p className="truncate text-xs text-muted">
                {customer.phone_number ?? "No phone"} ·{" "}
                {formatPoints(customer.points_balance)} pts
                {customer.barcode_id ? " · has a card" : ""}
              </p>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-brand px-3.5 text-sm font-semibold text-brand-contrast transition-colors hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-70"
            >
              Link this card
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
