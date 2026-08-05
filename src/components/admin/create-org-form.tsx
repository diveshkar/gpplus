"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createOrganization,
  type CreateOrgState,
} from "@/lib/organizations/actions";
import { PasswordInput } from "@/components/ui/password-input";
import { btnPrimary, errorAlert, input, label } from "@/lib/ui";

const DEFAULT_BRAND = "#c1121f";

export function CreateOrgForm() {
  const router = useRouter();
  const initialState: CreateOrgState = {
    error: null,
    success: false,
    values: {
      name: "",
      admin_name: "",
      brand_color: DEFAULT_BRAND,
      redemption_threshold: "10000",
      redemption_value: "1",
      admin_email: "",
      admin_password: "",
    },
  };
  const [state, formAction, pending] = useActionState(
    createOrganization,
    initialState,
  );
  const [brandColor, setBrandColor] = useState(DEFAULT_BRAND);

  useEffect(() => {
    if (state.success) {
      toast.success("Organization created");
      router.push("/admin");
    }
  }, [state, router]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
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
          placeholder="Acme Paints"
          className={input}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="admin_name" className={label}>
          Display name (optional)
        </label>
        <input
          id="admin_name"
          name="admin_name"
          type="text"
          defaultValue={state.values.admin_name}
          placeholder="Shown in their dashboard greeting"
          className={input}
        />
      </div>

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

      <div className="mt-1 border-t border-border pt-5">
        <p className="text-sm font-semibold text-foreground">Admin login</p>
        <p className="mt-0.5 text-sm text-muted">
          The single login this organization signs in with. Share these
          credentials with them; they can change the password later.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="admin_email" className={label}>
          Admin email
        </label>
        <input
          id="admin_email"
          name="admin_email"
          type="email"
          autoComplete="off"
          required
          defaultValue={state.values.admin_email}
          placeholder="owner@acmepaints.lk"
          className={input}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="admin_password" className={label}>
          Temporary password
        </label>
        <PasswordInput
          id="admin_password"
          name="admin_password"
          autoComplete="off"
          required
          minLength={8}
          placeholder="At least 8 characters"
          className={`${input} font-mono`}
        />
        <p className="text-xs text-muted">
          Shown as plain text so you can copy it. The admin should change it
          after their first sign in.
        </p>
      </div>

      {state.error ? (
        <p role="alert" className={errorAlert}>
          {state.error}
        </p>
      ) : null}

      <div>
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? "Creating..." : "Create organization"}
        </button>
      </div>
    </form>
  );
}
