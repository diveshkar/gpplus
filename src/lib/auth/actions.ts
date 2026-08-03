"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = {
  error: string | null;
};

/**
 * Sign the admin in with email and password.
 *
 * Used as a Server Action from the login form. On success it redirects to the
 * admin home; on failure it returns a friendly message for the form to show.
 * We keep the message deliberately vague so it never hints whether the email
 * or the password was the part that did not match.
 */
export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Please enter both your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "That email and password did not match. Please try again." };
  }

  // redirect throws internally, so it must sit outside any try/catch.
  redirect("/");
}

/**
 * Sign the admin out and return them to the login screen.
 */
export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
