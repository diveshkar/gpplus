import { createClient } from "@/lib/supabase/server";
import type { Organization } from "@/lib/types";

/**
 * The signed-in org admin's own organization (its settings + branding).
 * RLS scopes the row to their org, so a plain single() returns exactly theirs.
 */
export async function getCurrentOrganization(): Promise<Organization> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .single();

  if (error) throw error;
  return data as Organization;
}

/**
 * Every organization on the platform, newest first. Only the super admin can
 * read more than their own row (enforced by RLS), so this is for the admin area.
 */
export async function listOrganizations(): Promise<Organization[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Organization[];
}
