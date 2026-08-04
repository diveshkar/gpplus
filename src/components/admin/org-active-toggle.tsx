"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setOrganizationActive } from "@/lib/organizations/actions";

/**
 * Suspend or reactivate an organization from the admin list.
 */
export function OrgActiveToggle({
  id,
  active,
}: {
  id: string;
  active: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      await setOrganizationActive(id, !active);
      router.refresh();
      toast.success(active ? "Organization suspended" : "Organization active");
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className="inline-flex h-8 items-center rounded-lg border border-border px-2.5 text-xs font-medium text-muted transition-colors hover:border-brand hover:text-brand disabled:opacity-60"
    >
      {pending ? "..." : active ? "Suspend" : "Reactivate"}
    </button>
  );
}
