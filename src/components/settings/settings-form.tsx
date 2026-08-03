"use client";

import { useActionState } from "react";
import {
  updateSettings,
  type SettingsState,
} from "@/lib/settings/actions";
import { btnPrimary, errorAlert, input, label } from "@/lib/ui";

export function SettingsForm({
  initialThreshold,
  initialValue,
}: {
  initialThreshold: string;
  initialValue: string;
}) {
  const initialState: SettingsState = {
    error: null,
    success: false,
    values: {
      redemption_threshold: initialThreshold,
      redemption_value: initialValue,
    },
  };
  const [state, formAction, pending] = useActionState(
    updateSettings,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="redemption_threshold" className={label}>
          Redemption threshold (points)
        </label>
        <input
          id="redemption_threshold"
          name="redemption_threshold"
          type="number"
          inputMode="decimal"
          min="0"
          step="1"
          required
          defaultValue={state.values.redemption_threshold}
          className={input}
        />
        <p className="text-xs text-muted">
          The minimum balance a customer needs before they can redeem anything.
          Lowering it lets customers already above the new number redeem right
          away.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="redemption_value" className={label}>
          Redemption value (LKR per point)
        </label>
        <input
          id="redemption_value"
          name="redemption_value"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          required
          defaultValue={state.values.redemption_value}
          className={input}
        />
        <p className="text-xs text-muted">
          What one point is worth when redeeming. Changing this re-values every
          customer&apos;s remaining points at their next redemption. Redemptions
          already made are frozen and never change.
        </p>
      </div>

      {state.error ? (
        <p role="alert" className={errorAlert}>
          {state.error}
        </p>
      ) : state.success ? (
        <p className="rounded-lg border border-success/20 bg-success/5 px-3.5 py-2.5 text-sm text-success">
          Settings saved.
        </p>
      ) : null}

      <div>
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? "Saving..." : "Save settings"}
        </button>
      </div>
    </form>
  );
}
