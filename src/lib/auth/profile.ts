import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/**
 * The signed-in user's profile (role + organization), or null if not signed in
 * or no profile row exists yet. Drives routing: super admins go to the platform
 * admin area, org admins go to their shop.
 */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, role, organization_id, full_name, phone, avatar_url, created_at, updated_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  return (data as Profile) ?? null;
}
