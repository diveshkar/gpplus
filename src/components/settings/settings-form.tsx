"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { updateSettings, type SettingsState } from "@/lib/settings/actions";
import { LogoUpload } from "@/components/ui/logo-upload";
import { btnPrimary, errorAlert, input, label } from "@/lib/ui";

const DEFAULT_BRAND = "#c1121f";

export function SettingsForm({
  initialName,
  initialLogo,
  initialBrandColor,
  initialThreshold,
  initialValue,
}: {
  initialName: string;
  initialLogo: string;
  initialBrandColor: string;
  initialThreshold: string;
  initialValue: string;
}) {
  const initialState: SettingsState = {
    error: null,
    success: false,
    values: {
      admin_name: initialName,
      logo_url: initialLogo,
      brand_color: initialBrandColor,
      redemption_threshold: initialThreshold,
      redemption_value: initialValue,
    },
  };
  const [state, formAction, pending] = useActionState(
    updateSettings,
    initialState,
  );

  const [brandColor, setBrandColor] = useState(
    initialBrandColor || DEFAULT_BRAND,
  );

  useEffect(() => {
    if (state.success) toast.success("Settings saved");
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <LogoUpload
        name="logo_url"
        initialUrl={initialLogo}
        helpText="Shown in the sidebar, mobile header, loading screen, and on printed cards. A square image works best."
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="admin_name" className={label}>
          Display name
        </label>
        <input
          id="admin_name"
          name="admin_name"
          type="text"
          autoComplete="off"
          defaultValue={state.values.admin_name}
          placeholder="ShopName"
          className={input}
        />
        <p className="text-xs text-muted">
          The name shown in your dashboard greeting. Leave blank to use your
          email instead.
        </p>
      </div>

      {/* Brand colour */}
      <div className="flex flex-col gap-1.5">
        <span className={label}>Brand colour</span>
        <div className="flex items-center gap-3">
          <label
            className="relative h-11 w-14 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-border"
            style={{ backgroundColor: brandColor }}
            title="Pick a colour"
          >
            <input
              type="color"
              value={brandColor}
              onChange={(event) => setBrandColor(event.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label="Brand colour picker"
            />
          </label>
          <input
            type="text"
            value={brandColor}
            onChange={(event) => setBrandColor(event.target.value)}
            spellCheck={false}
            className={`${input} max-w-40 font-mono uppercase`}
          />
          <button
            type="button"
            onClick={() => setBrandColor(DEFAULT_BRAND)}
            className="inline-flex h-10 items-center rounded-xl px-3 text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            Reset
          </button>
        </div>
        <p className="text-xs text-muted">
          Used for buttons, highlights, and accents across your shop. Pick a
          strong colour with good contrast against white.
        </p>
        <input type="hidden" name="brand_color" value={brandColor} />
      </div>

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
      ) : null}

      <div>
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? "Saving..." : "Save settings"}
        </button>
      </div>
    </form>
  );
}
