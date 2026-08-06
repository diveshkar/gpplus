"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { updateCardDesign, type CardDesignState } from "@/lib/cards/actions";
import { btnPrimary, errorAlert, input, label } from "@/lib/ui";

export function CardDesignForm({
  title,
  tagline,
  backEnabled,
  backText,
}: {
  title: string;
  tagline: string;
  backEnabled: boolean;
  backText: string;
}) {
  const initial: CardDesignState = { error: null, success: false };
  const [state, formAction, pending] = useActionState(updateCardDesign, initial);
  const [showBack, setShowBack] = useState(backEnabled);

  useEffect(() => {
    if (state.success) toast.success("Card design saved");
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="card_title" className={label}>
            Card title
          </label>
          <input
            id="card_title"
            name="card_title"
            type="text"
            defaultValue={title}
            placeholder="Member Card"
            className={input}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="card_tagline" className={label}>
            Tagline (optional)
          </label>
          <input
            id="card_tagline"
            name="card_tagline"
            type="text"
            defaultValue={tagline}
            placeholder="e.g. Earn points on every visit"
            className={input}
          />
        </div>
      </div>

      <label className="flex items-center gap-2.5">
        <input
          type="checkbox"
          name="card_back_enabled"
          checked={showBack}
          onChange={(event) => setShowBack(event.target.checked)}
          className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
        />
        <span className="text-sm text-foreground">
          Print a back side on the card
        </span>
      </label>

      {showBack ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="card_back_text" className={label}>
            Back text
          </label>
          <textarea
            id="card_back_text"
            name="card_back_text"
            rows={4}
            defaultValue={backText}
            placeholder="How the program works, terms, or contact details."
            className={`${input} h-auto py-2.5`}
          />
        </div>
      ) : null}

      {state.error ? (
        <p role="alert" className={errorAlert}>
          {state.error}
        </p>
      ) : null}

      <div>
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? "Saving..." : "Save card design"}
        </button>
      </div>
      <p className="text-xs text-muted">
        The card uses your logo, business name, and brand colour automatically.
        These settings apply to every card you generate from now on.
      </p>
    </form>
  );
}
