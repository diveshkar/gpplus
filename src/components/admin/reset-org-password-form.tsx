"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  resetOrgAdminPassword,
  type ResetPasswordState,
} from "@/lib/organizations/actions";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordStrength } from "@/components/ui/password-strength";
import { btnPrimary, errorAlert, input, label } from "@/lib/ui";

/**
 * Lets the super admin set a new temporary password for an organization's admin
 * login. No email is sent; the super admin hands the new password over directly.
 */
export function ResetOrgPasswordForm({ orgId }: { orgId: string }) {
  const initialState: ResetPasswordState = { error: null, success: false };
  const [state, formAction, pending] = useActionState(
    resetOrgAdminPassword,
    initialState,
  );
  const [password, setPassword] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success("Temporary password set");
      formRef.current?.reset();
      setPassword("");
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="org_id" value={orgId} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="reset_password" className={label}>
          New temporary password
        </label>
        <PasswordInput
          id="reset_password"
          name="password"
          autoComplete="off"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 8 characters"
          className={`${input} font-mono`}
        />
        <PasswordStrength password={password} />
        <p className="text-xs text-muted">
          Share this with the business. They can change it later from their own
          settings.
        </p>
      </div>

      {state.error ? (
        <p role="alert" className={errorAlert}>
          {state.error}
        </p>
      ) : null}

      <div>
        <button
          type="submit"
          disabled={pending || password.length < 8}
          className={btnPrimary}
        >
          {pending ? "Setting..." : "Set temporary password"}
        </button>
      </div>
    </form>
  );
}
