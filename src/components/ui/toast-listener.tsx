"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

type ToastKind = "success" | "error" | "warning" | "info";

// Redirect-based feedback: a server action appends ?toast=<key> and this fires
// the matching toast once, then cleans the URL.
const MESSAGES: Record<string, { kind: ToastKind; message: string }> = {
  logged_in: { kind: "success", message: "Welcome back" },
  logged_out: { kind: "success", message: "Signed out" },
  customer_saved: { kind: "success", message: "Customer saved" },
  card_linked: { kind: "success", message: "Card linked to customer" },
  earn_saved: { kind: "success", message: "Points added" },
  redeem_saved: { kind: "success", message: "Redemption saved" },
  tx_updated: { kind: "success", message: "Transaction updated" },
  suspended: {
    kind: "warning",
    message: "This organization is suspended. Contact the administrator.",
  },
  no_org: {
    kind: "warning",
    message: "Your account is not linked to an organization yet.",
  },
};

export function ToastListener() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const firedFor = useRef<string | null>(null);

  const key = searchParams.get("toast");

  useEffect(() => {
    if (!key) return;
    // Guard against firing twice for the same param (dev strict mode).
    if (firedFor.current === key) return;
    firedFor.current = key;

    const entry = MESSAGES[key];
    if (entry) {
      toast[entry.kind](entry.message);
    }

    // Remove the toast param without adding a history entry.
    const params = new URLSearchParams(searchParams.toString());
    params.delete("toast");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [key, pathname, router, searchParams]);

  return null;
}
