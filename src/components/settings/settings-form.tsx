"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  updateSettings,
  type SettingsState,
} from "@/lib/settings/actions";
import { btnPrimary, btnSecondary, errorAlert, input, label } from "@/lib/ui";

const DEFAULT_LOGO = "/gpplus-mark.png";

// Resize a chosen image to a small PNG data URL so the stored logo stays light.
function fileToResizedDataUrl(file: File, max = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.onload = () => {
      const img = document.createElement("img");
      img.onerror = () => reject(new Error("Could not load the image"));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

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

  const [logo, setLogo] = useState(initialLogo);
  const [brandColor, setBrandColor] = useState(
    initialBrandColor || DEFAULT_BRAND,
  );
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleLogoFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setLogo(dataUrl);
    } catch {
      toast.error("Could not process that image");
    }
  }

  useEffect(() => {
    if (state.success) toast.success("Settings saved");
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {/* Brand logo */}
      <div className="flex flex-col gap-2">
        <span className={label}>Brand logo</span>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-border bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logo || DEFAULT_LOGO}
              alt="Logo preview"
              className="h-12 w-12 object-contain"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={`${btnSecondary} h-10`}
            >
              Upload logo
            </button>
            {logo ? (
              <button
                type="button"
                onClick={() => setLogo("")}
                className="inline-flex h-10 items-center rounded-xl px-3 text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                Reset to default
              </button>
            ) : null}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleLogoFile(file);
              event.target.value = "";
            }}
          />
        </div>
        <p className="text-xs text-muted">
          Shown in the sidebar, mobile header, and loading screen. A square image
          works best. The login screen keeps the default mark.
        </p>
        <input type="hidden" name="logo_url" value={logo} />
      </div>

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
