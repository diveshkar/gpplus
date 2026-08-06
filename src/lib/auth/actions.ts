"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/profile";

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

  // Send each role straight to its own home. The super admin used to land on "/"
  // (the shop layout), which then redirected to "/admin" — that extra hop, right
  // after the session cookie was set, intermittently failed on the first load
  // and only worked after a manual refresh. Routing directly avoids the bounce.
  // If the profile lookup fails for any reason, fall back to "/"; the layouts
  // still guard and re-route from there, so sign-in itself never gets blocked.
  let destination = "/?toast=logged_in";
  try {
    const profile = await getProfile();
    if (profile?.role === "super_admin") destination = "/admin";
  } catch {
    // Ignore and use the default; the app-layout guard will redirect if needed.
  }

  // redirect throws internally, so it must sit outside any try/catch.
  redirect(destination);
}

/**
 * Sign the admin out and return them to the login screen.
 */
export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login?toast=logged_out");
}
