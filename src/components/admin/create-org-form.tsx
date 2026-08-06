"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createOrganization,
  type CreateOrgState,
} from "@/lib/organizations/actions";
import { PasswordInput } from "@/components/ui/password-input";
import { LogoUpload } from "@/components/ui/logo-upload";
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
  const [cardsEnabled, setCardsEnabled] = useState(false);
  const [categories, setCategories] = useState<
    { name: string; earning_percentage: string }[]
  >([
    { name: "Standard", earning_percentage: "0.5" },
    { name: "Premium", earning_percentage: "1" },
  ]);

  function updateCategory(index: number, key: "name" | "earning_percentage", value: string) {
    setCategories((list) =>
      list.map((c, i) => (i === index ? { ...c, [key]: value } : c)),
    );
  }
  function addCategory() {
    setCategories((list) => [...list, { name: "", earning_percentage: "" }]);
  }
  function removeCategory(index: number) {
    setCategories((list) => list.filter((_, i) => i !== index));
  }

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

      <LogoUpload
        name="logo_url"
        initialUrl=""
        helpText="Shown in their dashboard, sidebar, and on printed cards. Optional — a default mark is used if left empty."
      />

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

      {/* Optional features */}
      <div className="flex flex-col gap-2 border-t border-border pt-5">
        <span className={label}>Features</span>
        <label className="flex items-start gap-2.5">
          <input
            type="checkbox"
            name="cards_enabled"
            checked={cardsEnabled}
            onChange={(event) => setCardsEnabled(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border text-brand focus:ring-brand"
          />
          <span className="text-sm text-foreground">
            Loyalty cards
            <span className="mt-0.5 block text-xs font-normal text-muted">
              Lets this business design and generate printable loyalty cards. Off
              by default; you can turn it on or off later.
            </span>
          </span>
        </label>
      </div>

      {/* Starter categories */}
      <div className="flex flex-col gap-2 border-t border-border pt-5">
        <span className={label}>Categories</span>
        <p className="text-sm text-muted">
          The kinds of products or services this business sells, and the points
          each earns. They can change these later in their own settings.
        </p>
        <div className="mt-1 flex flex-col gap-2">
          {categories.map((cat, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={cat.name}
                onChange={(e) => updateCategory(i, "name", e.target.value)}
                placeholder="Category name"
                className={`${input} flex-1`}
              />
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={cat.earning_percentage}
                onChange={(e) =>
                  updateCategory(i, "earning_percentage", e.target.value)
                }
                placeholder="%"
                className={`${input} w-24`}
                aria-label="Earning rate percent"
              />
              <button
                type="button"
                onClick={() => removeCategory(i)}
                aria-label="Remove category"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-muted transition-colors hover:border-danger hover:text-danger"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
                  <path
                    d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addCategory}
          className="mt-1 self-start text-sm font-semibold text-brand hover:text-brand-strong"
        >
          + Add category
        </button>
        <input
          type="hidden"
          name="categories"
          value={JSON.stringify(categories)}
        />
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
