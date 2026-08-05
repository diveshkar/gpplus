"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteOrganization } from "@/lib/organizations/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

/**
 * Permanently delete an organization from the admin list. Removes the business,
 * all of its data, and its admin login. Guarded by a confirmation dialog.
 */
export function OrgDeleteButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      await deleteOrganization(id);
      router.refresh();
      toast.success("Organization deleted");
    });
  }

  return (
    <ConfirmDialog
      title={`Delete ${name}?`}
      description="This permanently removes the business, all of its customers and activity, and its admin login. This cannot be undone."
      confirmLabel="Delete"
      variant="danger"
      onConfirm={remove}
      trigger={
        <button
          type="button"
          disabled={pending}
          aria-label={`Delete ${name}`}
          className="inline-flex h-8 items-center rounded-lg border border-border px-2.5 text-xs font-medium text-muted transition-colors hover:border-danger hover:text-danger disabled:opacity-60"
        >
          {pending ? "..." : "Delete"}
        </button>
      }
    />
  );
}
