"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { changePassword, type PasswordState } from "@/lib/profile/actions";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordStrength } from "@/components/ui/password-strength";
import { btnPrimary, errorAlert, label } from "@/lib/ui";

const inputBase =
  "h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm text-foreground placeholder:text-muted/70 transition-[border-color,box-shadow] focus:border-brand focus:ring-4 focus:ring-brand/10 focus:outline-none";

export function ChangePasswordForm() {
  const initialState: PasswordState = { error: null, success: false };
  const [state, formAction, pending] = useActionState(
    changePassword,
    initialState,
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success("Password updated");
      formRef.current?.reset();
      setPassword("");
      setConfirm("");
    }
  }, [state]);

  const mismatch = confirm.length > 0 && confirm !== password;

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className={label}>
            New password
          </label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            className={inputBase}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirm_password" className={label}>
            Confirm password
          </label>
          <PasswordInput
            id="confirm_password"
            name="confirm_password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            placeholder="Re-enter the password"
            className={inputBase}
          />
        </div>
      </div>

      <PasswordStrength password={password} />

      {mismatch ? (
        <p className="text-xs text-danger">The passwords do not match.</p>
      ) : null}

      {state.error ? (
        <p role="alert" className={errorAlert}>
          {state.error}
        </p>
      ) : null}

      <div>
        <button
          type="submit"
          disabled={pending || mismatch || password.length < 8}
          className={btnPrimary}
        >
          {pending ? "Updating..." : "Update password"}
        </button>
      </div>
    </form>
  );
}
