"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  type AdminCategoryState,
} from "@/lib/organizations/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { btnPrimary, btnSecondary, errorAlert, input, label } from "@/lib/ui";

type Category = {
  id: string;
  name: string;
  earning_percentage: number;
};

function CategoryRow({ orgId, category }: { orgId: string; category: Category }) {
  const router = useRouter();
  const initialState: AdminCategoryState = {
    error: null,
    success: false,
    values: {
      name: category.name,
      earning_percentage: String(category.earning_percentage),
    },
  };
  // Bind the org and the category id so the action knows which row to update.
  const updateAction = adminUpdateCategory.bind(null, orgId, category.id);
  const [state, formAction, pending] = useActionState(updateAction, initialState);
  const [deleting, startDelete] = useTransition();

  useEffect(() => {
    if (state.success) toast.success("Category saved");
  }, [state]);

  function remove() {
    startDelete(async () => {
      await adminDeleteCategory(orgId, category.id);
      router.refresh();
      toast.success("Category removed");
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 py-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`name-${category.id}`} className={label}>
            Name
          </label>
          <input
            id={`name-${category.id}`}
            name="name"
            type="text"
            required
            autoComplete="off"
            defaultValue={state.values.name}
            className={input}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`pct-${category.id}`} className={label}>
            Earning rate (%)
          </label>
          <div className="flex items-center gap-2">
            <input
              id={`pct-${category.id}`}
              name="earning_percentage"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              required
              defaultValue={state.values.earning_percentage}
              className={`${input} w-24`}
            />
            <button type="submit" disabled={pending} className={btnSecondary}>
              {pending ? "Saving..." : "Save"}
            </button>
            <ConfirmDialog
              title="Remove this category?"
              description="Customers and past sales that used it keep their history. Only the category itself is removed."
              confirmLabel="Remove"
              variant="danger"
              onConfirm={remove}
              trigger={
                <button
                  type="button"
                  disabled={deleting}
                  aria-label={`Remove ${category.name}`}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border text-muted transition-colors hover:border-danger hover:text-danger disabled:opacity-60"
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
              }
            />
          </div>
        </div>
      </div>

      {state.error ? (
        <p role="alert" className={errorAlert}>
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

function AddCategory({ orgId }: { orgId: string }) {
  const initialState: AdminCategoryState = {
    error: null,
    success: false,
    values: { name: "", earning_percentage: "" },
  };
  const createAction = adminCreateCategory.bind(null, orgId);
  const [state, formAction, pending] = useActionState(createAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success("Category added");
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3 py-4">
      <p className="text-sm font-semibold text-foreground">Add a category</p>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-name" className={label}>
            Name
          </label>
          <input
            id="new-name"
            name="name"
            type="text"
            required
            autoComplete="off"
            placeholder="e.g. Standard, Premium, Service"
            className={input}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-pct" className={label}>
            Earning rate (%)
          </label>
          <div className="flex items-center gap-2">
            <input
              id="new-pct"
              name="earning_percentage"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              required
              placeholder="0.5"
              className={`${input} w-24`}
            />
            <button type="submit" disabled={pending} className={btnPrimary}>
              {pending ? "Adding..." : "Add"}
            </button>
          </div>
        </div>
      </div>

      {state.error ? (
        <p role="alert" className={errorAlert}>
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

/**
 * Super-admin editor for one organization's categories: rename, change rate,
 * add, or remove. Mirrors the business's own Settings editor, but writes to the
 * chosen org via super-admin actions instead of the caller's own org.
 */
export function OrgCategoriesForm({
  orgId,
  categories,
}: {
  orgId: string;
  categories: Category[];
}) {
  return (
    <div className="divide-y divide-border">
      {categories.map((category) => (
        <CategoryRow key={category.id} orgId={orgId} category={category} />
      ))}
      <AddCategory orgId={orgId} />
    </div>
  );
}
