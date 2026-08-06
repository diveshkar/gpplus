"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { reportCardLost } from "@/lib/cards/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

/**
 * Reports a customer's current card as lost. It is marked lost in the pool and
 * unlinked from the customer, ready for a replacement to be scanned.
 */
export function ReportLostButton({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      await reportCardLost(customerId);
      router.refresh();
      toast.success("Card reported lost");
    });
  }

  return (
    <ConfirmDialog
      title="Report this card as lost?"
      description="The card is marked lost and unlinked from this customer. Their points stay the same. Scan a new card to give them a replacement."
      confirmLabel="Report lost"
      variant="danger"
      onConfirm={run}
      trigger={
        <button
          type="button"
          disabled={pending}
          className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm font-medium text-muted transition-colors hover:border-danger hover:text-danger disabled:opacity-60"
        >
          {pending ? "..." : "Report lost"}
        </button>
      }
    />
  );
}
