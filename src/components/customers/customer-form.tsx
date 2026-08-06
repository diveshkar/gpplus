"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  createCustomer,
  updateCustomer,
  type CustomerFormState,
  type CustomerFormValues,
} from "@/lib/customers/actions";
import { btnPrimary, errorAlert, input, label, select } from "@/lib/ui";

export function CustomerForm({
  paintTypes,
  initialBarcode = "",
  mode = "create",
  customerId,
  initialValues,
  cancelHref = "/customers",
}: {
  paintTypes: { id: string; name: string }[];
  initialBarcode?: string;
  mode?: "create" | "edit";
  customerId?: string;
  initialValues?: CustomerFormValues;
  cancelHref?: string;
}) {
  const isEdit = mode === "edit";
  const initialState: CustomerFormState = {
    error: null,
    values:
      initialValues ?? {
        full_name: "",
        address: "",
        date_of_birth: "",
        phone_number: "",
        default_paint_type_id: "",
        barcode_id: initialBarcode,
      },
  };

  const [state, formAction, pending] = useActionState(
    isEdit ? updateCustomer : createCustomer,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {isEdit && customerId ? (
        <input type="hidden" name="customer_id" value={customerId} />
      ) : null}
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
          placeholder="Customer Name"
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
          Default category
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
              Choose a category
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
          The category used to work out points by default. It can be changed per
          sale later.
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

      {!isEdit ? (
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
      ) : null}

      {state.error ? (
        <p role="alert" className={errorAlert}>
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center gap-3 pt-1">
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
              {isEdit ? "Save changes" : "Save customer"}
            </>
          )}
        </button>
        <Link
          href={cancelHref}
          className="text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
