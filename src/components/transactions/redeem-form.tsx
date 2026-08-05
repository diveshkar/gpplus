"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useActionState } from "react";
import {
  createRedeemTransaction,
  type RedeemFormState,
} from "@/lib/transactions/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatLKR, formatPoints } from "@/lib/format";
import { btnPrimary, errorAlert, input, label } from "@/lib/ui";

/**
 * The redeem form, shared by the scan popup and the per-customer redeem page.
 *
 * If the customer is below the threshold, redemption is blocked outright with a
 * clear message and no amount field. Otherwise the admin enters the product's
 * LKR value, and a live preview shows the points that will come off and what is
 * left. The database re-checks the threshold and balance on save.
 */
export function RedeemForm({
  customerId,
  balance,
  threshold,
  value,
  onCancel,
  cancelHref,
}: {
  customerId: string;
  balance: number;
  threshold: number;
  value: number;
  onCancel?: () => void;
  cancelHref?: string;
}) {
  const initialState: RedeemFormState = {
    error: null,
    values: { amount: "", description: "" },
  };
  const [state, formAction, pending] = useActionState(
    createRedeemTransaction,
    initialState,
  );
  const [amount, setAmount] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const worth = balance * value;
  const belowThreshold = balance < threshold;

  const numericAmount = Number(amount);
  const validAmount =
    amount !== "" && !Number.isNaN(numericAmount) && numericAmount > 0;
  const pointsToDeduct = validAmount ? numericAmount / value : 0;
  const overBalance = validAmount && numericAmount > worth + 0.0001;
  const remainingPoints = Math.max(balance - pointsToDeduct, 0);

  const cancel = onCancel ? (
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
  ) : null;

  if (belowThreshold) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3.5 text-sm text-warning">
          <p className="font-medium">Not enough points to redeem yet</p>
          <p className="mt-1">
            Redeeming needs at least {formatPoints(threshold)} points. This
            customer has {formatPoints(balance)}, so they are{" "}
            {formatPoints(threshold - balance)} short. Their points stay safely
            in their account until they get there.
          </p>
        </div>
        {cancel}
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="customer_id" value={customerId} />

      <div className="rounded-lg border border-border bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Balance</span>
          <span className="text-sm font-medium text-foreground">
            {formatPoints(balance)} points
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-sm text-muted">Worth</span>
          <span className="text-sm font-medium text-foreground">
            {formatLKR(worth)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="amount" className={label}>
          Product value to give (LKR)
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
          placeholder="e.g. 7500"
          className={input}
        />
        <button
          type="button"
          onClick={() => setAmount(String(worth))}
          className="self-start text-xs font-medium text-brand transition-colors hover:text-brand-strong"
        >
          Redeem full balance ({formatLKR(worth)})
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className={label}>
          Product given
        </label>
        <input
          id="description"
          name="description"
          type="text"
          autoComplete="off"
          defaultValue={state.values.description}
          placeholder="e.g. 4 litre tin of emulsion"
          className={input}
        />
      </div>

      {/* Live preview */}
      <div className="flex flex-col gap-2 rounded-lg border border-brand-soft bg-brand-soft/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Points deducted</span>
          <span className="font-heading text-lg font-semibold text-brand-strong">
            {formatPoints(pointsToDeduct)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Points remaining</span>
          <span className="text-sm font-medium text-foreground">
            {formatPoints(remainingPoints)}
          </span>
        </div>
      </div>

      {overBalance ? (
        <p role="alert" className={errorAlert}>
          That is more than the balance is worth ({formatLKR(worth)}).
        </p>
      ) : state.error ? (
        <p role="alert" className={errorAlert}>
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <ConfirmDialog
          title="Confirm redemption"
          description={
            validAmount ? (
              <>
                Give a product worth{" "}
                <span className="font-medium text-foreground">
                  {formatLKR(numericAmount)}
                </span>{" "}
                and deduct{" "}
                <span className="font-medium text-foreground">
                  {formatPoints(pointsToDeduct)}
                </span>{" "}
                points. {formatPoints(remainingPoints)} points will remain.
              </>
            ) : (
              "Please enter a valid amount first."
            )
          }
          confirmLabel="Redeem"
          onConfirm={() => formRef.current?.requestSubmit()}
          trigger={
            <button
              type="button"
              disabled={pending || overBalance || !validAmount}
              className={btnPrimary}
            >
              {pending ? "Saving..." : "Redeem"}
            </button>
          }
        />
        {cancel}
      </div>
    </form>
  );
}
