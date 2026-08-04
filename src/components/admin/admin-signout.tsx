"use client";

import { logout } from "@/lib/auth/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

/**
 * Sign-out control for the platform admin header. Lives in a Client Component
 * because it passes an onConfirm handler to ConfirmDialog, which a Server
 * Component (the admin layout) cannot do.
 */
export function AdminSignOut({ email }: { email: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="hidden text-sm text-muted sm:inline"
        title={email}
      >
        {email}
      </span>
      <ConfirmDialog
        title="Sign out?"
        description="You will need to sign in again to manage the platform."
        confirmLabel="Sign out"
        onConfirm={() => logout()}
        trigger={
          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted transition-colors hover:bg-background hover:text-foreground"
          >
            Sign out
          </button>
        }
      />
    </div>
  );
}
