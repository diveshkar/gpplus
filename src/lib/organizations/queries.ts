import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/profile";
import type { Organization, PaintType } from "@/lib/types";

/**
 * The signed-in org admin's own organization (its settings + branding).
 * RLS scopes rows to their org, so this returns exactly theirs.
 *
 * If there is no org for the caller (for example a super admin, whose layout is
 * mid-redirect to /admin, or an account with no org), we redirect instead of
 * throwing. That avoids a hard crash and the noisy "0 rows" error during a
 * render that is being discarded anyway.
 */
export async function getCurrentOrganization(): Promise<Organization> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organizations")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (!data) {
    const profile = await getProfile();
    redirect(profile?.role === "super_admin" ? "/admin" : "/login?toast=no_org");
  }

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

export type OrganizationWithStats = Organization & {
  customer_count: number;
  points_liability: number;
  last_active: string | null;
};

/**
 * Every organization plus its size and activity, for the super admin table.
 * Combines the org rows with the per-org stats function in one pass.
 */
export async function listOrganizationsWithStats(): Promise<
  OrganizationWithStats[]
> {
  const supabase = await createClient();
  const [orgsResult, statsResult] = await Promise.all([
    supabase
      .from("organizations")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.rpc("admin_organization_stats"),
  ]);

  if (orgsResult.error) throw orgsResult.error;
  if (statsResult.error) throw statsResult.error;

  const stats = new Map<
    string,
    { customer_count: number; points_liability: number; last_active: string | null }
  >();
  for (const row of statsResult.data ?? []) {
    stats.set(row.organization_id, {
      customer_count: Number(row.customer_count),
      points_liability: Number(row.points_liability),
      last_active: row.last_active,
    });
  }

  return (orgsResult.data as Organization[]).map((org) => ({
    ...org,
    customer_count: stats.get(org.id)?.customer_count ?? 0,
    points_liability: stats.get(org.id)?.points_liability ?? 0,
    last_active: stats.get(org.id)?.last_active ?? null,
  }));
}

/**
 * A single organization by id, or null. Super admin only in practice, since RLS
 * limits anyone else to their own org.
 */
export async function getOrganizationById(
  id: string,
): Promise<Organization | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return (data as Organization) ?? null;
}

/**
 * The categories (paint types) belonging to one organization, oldest first.
 * For the super admin edit-org screen: RLS lets the super admin read any org's
 * rows, so this returns exactly that org's categories.
 */
export async function getOrganizationCategories(
  orgId: string,
): Promise<PaintType[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("paint_types")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as PaintType[];
}
