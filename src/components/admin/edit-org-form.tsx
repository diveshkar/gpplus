"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  updateOrganization,
  type EditOrgState,
} from "@/lib/organizations/actions";
import { LogoUpload } from "@/components/ui/logo-upload";
import { btnPrimary, errorAlert, input, label } from "@/lib/ui";
import type { Organization } from "@/lib/types";

const DEFAULT_BRAND = "#c1121f";

export function EditOrgForm({ org }: { org: Organization }) {
  const initialState: EditOrgState = {
    error: null,
    success: false,
    values: {
      name: org.name,
      admin_name: org.admin_name ?? "",
      brand_color: org.brand_color,
      logo_url: org.logo_url ?? "",
      redemption_threshold: String(org.redemption_threshold),
      redemption_value: String(org.redemption_value),
    },
  };
  const [state, formAction, pending] = useActionState(
    updateOrganization,
    initialState,
  );
  const [brandColor, setBrandColor] = useState(org.brand_color || DEFAULT_BRAND);

  useEffect(() => {
    if (state.success) toast.success("Organization saved");
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="id" value={org.id} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className={label}>
          Organization name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={state.values.name}
          className={input}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="admin_name" className={label}>
          Display name
        </label>
        <input
          id="admin_name"
          name="admin_name"
          type="text"
          defaultValue={state.values.admin_name}
          placeholder="Shown in their dashboard and sidebar"
          className={input}
        />
      </div>

      <LogoUpload name="logo_url" initialUrl={org.logo_url ?? ""} />

      {/* Brand colour */}
      <div className="flex flex-col gap-1.5">
        <span className={label}>Brand colour</span>
        <div className="flex items-center gap-3">
          <label
            className="relative h-11 w-14 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-border"
            style={{ backgroundColor: brandColor }}
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
        </div>
        <input type="hidden" name="brand_color" value={brandColor} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="redemption_threshold" className={label}>
            Redemption threshold
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
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="redemption_value" className={label}>
            Redemption value (LKR/point)
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
        </div>
      </div>

      {state.error ? (
        <p role="alert" className={errorAlert}>
          {state.error}
        </p>
      ) : null}

      <div>
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}
