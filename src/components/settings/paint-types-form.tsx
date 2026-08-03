"use client";

import { useActionState } from "react";
import {
  updatePaintType,
  type PaintTypeState,
} from "@/lib/settings/actions";
import { btnSecondary, errorAlert, input, label } from "@/lib/ui";

type PaintType = {
  id: string;
  name: string;
  earning_percentage: number;
};

function PaintTypeRow({ paintType }: { paintType: PaintType }) {
  const initialState: PaintTypeState = {
    error: null,
    success: false,
    values: {
      name: paintType.name,
      earning_percentage: String(paintType.earning_percentage),
    },
  };
  const [state, formAction, pending] = useActionState(
    updatePaintType,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3 py-4">
      <input type="hidden" name="paint_type_id" value={paintType.id} />

      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`name-${paintType.id}`} className={label}>
            Name
          </label>
          <input
            id={`name-${paintType.id}`}
            name="name"
            type="text"
            required
            autoComplete="off"
            defaultValue={state.values.name}
            className={input}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`pct-${paintType.id}`} className={label}>
            Earning rate (%)
          </label>
          <div className="flex items-center gap-2">
            <input
              id={`pct-${paintType.id}`}
              name="earning_percentage"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              required
              defaultValue={state.values.earning_percentage}
              className={`${input} w-28`}
            />
            <button type="submit" disabled={pending} className={btnSecondary}>
              {pending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>

      {state.error ? (
        <p role="alert" className={errorAlert}>
          {state.error}
        </p>
      ) : state.success ? (
        <p className="text-sm text-success">Saved.</p>
      ) : null}
    </form>
  );
}

export function PaintTypesForm({ paintTypes }: { paintTypes: PaintType[] }) {
  return (
    <div className="divide-y divide-border">
      {paintTypes.map((paintType) => (
        <PaintTypeRow key={paintType.id} paintType={paintType} />
      ))}
    </div>
  );
}
