"use server";

import { createClient } from "@/lib/supabase/server";

export type PasswordState = {
  error: string | null;
  success: boolean;
};

/**
 * Change the signed-in admin's password. Uses their own session, so no email
 * or old password is required, matching the "change it any time" behaviour.
 */
export async function changePassword(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters.", success: false };
  }
  if (password !== confirm) {
    return { error: "The passwords do not match.", success: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    console.error("changePassword: failed", error);
    return {
      error: "Could not update your password. Please try again.",
      success: false,
    };
  }

  return { error: null, success: true };
}
