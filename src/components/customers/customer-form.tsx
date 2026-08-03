"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  createCustomer,
  type CustomerFormState,
} from "@/lib/customers/actions";
import { btnPrimary, errorAlert, input, label, select } from "@/lib/ui";

export function CustomerForm({
  paintTypes,
  initialBarcode,
}: {
  paintTypes: { id: string; name: string }[];
  initialBarcode: string;
}) {
  const initialState: CustomerFormState = {
    error: null,
    values: {
      full_name: "",
      address: "",
      date_of_birth: "",
      phone_number: "",
      default_paint_type_id: "",
      barcode_id: initialBarcode,
    },
  };

  const [state, formAction, pending] = useActionState(
    createCustomer,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="full_name" className={label}>
          Full name
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          autoComplete="off"
          defaultValue={state.values.full_name}
          placeholder="e.g. Nimal Perera"
          className={input}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="phone_number" className={label}>
            Phone number
          </label>
          <input
            id="phone_number"
            name="phone_number"
            type="tel"
            autoComplete="off"
            defaultValue={state.values.phone_number}
            placeholder="e.g. 077 123 4567"
            className={input}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="date_of_birth" className={label}>
            Date of birth
          </label>
          <input
            id="date_of_birth"
            name="date_of_birth"
            type="date"
            defaultValue={state.values.date_of_birth}
            className={input}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="default_paint_type_id" className={label}>
          Customer type
        </label>
        <div className="relative">
          <select
            id="default_paint_type_id"
            name="default_paint_type_id"
            required
            defaultValue={state.values.default_paint_type_id}
            className={select}
          >
            <option value="" disabled>
              Choose a paint type
            </option>
            {paintTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
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
          The paint type used to work out points by default. It can be changed
          per transaction later.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="address" className={label}>
          Address
        </label>
        <textarea
          id="address"
          name="address"
          rows={2}
          defaultValue={state.values.address}
          placeholder="Optional"
          className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/70 transition-colors focus:border-brand"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="barcode_id" className={label}>
          Loyalty card barcode
        </label>
        <input
          id="barcode_id"
          name="barcode_id"
          type="text"
          required
          autoComplete="off"
          defaultValue={state.values.barcode_id}
          placeholder="Scan the customer's card"
          className={input}
        />
        {initialBarcode ? (
          <p className="text-xs text-success">
            Card detected from scan and filled in for you.
          </p>
        ) : (
          <p className="text-xs text-muted">
            Scan the card to link it to this customer permanently.
          </p>
        )}
      </div>

      {state.error ? (
        <p role="alert" className={errorAlert}>
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center gap-3 pt-1">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? "Saving..." : "Save customer"}
        </button>
        <Link
          href="/customers"
          className="text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
