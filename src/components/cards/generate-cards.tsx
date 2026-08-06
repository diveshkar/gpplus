"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { generateCards, type GenerateCardsState } from "@/lib/cards/actions";
import { btnPrimary, btnSecondary, errorAlert, input, label } from "@/lib/ui";

export function GenerateCards() {
  const initial: GenerateCardsState = { error: null, batchId: null, count: 0 };
  const [state, formAction, pending] = useActionState(generateCards, initial);

  useEffect(() => {
    if (state.batchId) toast.success(`${state.count} cards generated`);
  }, [state]);

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="count" className={label}>
            How many cards
          </label>
          <input
            id="count"
            name="count"
            type="number"
            min="1"
            max="2000"
            defaultValue="200"
            required
            className={`${input} w-36`}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="prefix" className={label}>
            Code prefix
          </label>
          <input
            id="prefix"
            name="prefix"
            type="text"
            maxLength={4}
            defaultValue="C"
            placeholder="Optional"
            className={`${input} w-28 uppercase`}
          />
        </div>
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? "Generating..." : "Generate cards"}
        </button>
      </form>

      {state.error ? (
        <p role="alert" className={errorAlert}>
          {state.error}
        </p>
      ) : null}

      {state.batchId ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-brand/20 bg-brand-soft px-4 py-3">
          <p className="text-sm font-medium text-brand-strong">
            {state.count} cards ready to print.
          </p>
          <div className="ml-auto flex flex-wrap gap-2">
            <a href={`/api/cards/${state.batchId}`} className={btnPrimary}>
              Download PDF
            </a>
            <a
              href={`/api/cards/${state.batchId}?format=xlsx`}
              className={btnSecondary}
            >
              Download Excel
            </a>
          </div>
        </div>
      ) : null}

      <p className="text-xs text-muted">
        Each card gets a unique barcode and is branded with your logo and colour.
        A card becomes active the first time it is scanned and linked to a
        customer.
      </p>
    </div>
  );
}
