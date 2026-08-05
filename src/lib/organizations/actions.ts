"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfile } from "@/lib/auth/profile";

export type CreateOrgValues = {
  name: string;
  admin_name: string;
  brand_color: string;
  redemption_threshold: string;
  redemption_value: string;
  admin_email: string;
  admin_password: string;
};

export type CreateOrgState = {
  error: string | null;
  success: boolean;
  values: CreateOrgValues;
};

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

// The starter template every new organization begins with. They can rename
// these, change the rates, or add more from their own Settings afterwards.
const DEFAULT_PAINT_TYPES = [
  { name: "Decorative", earning_percentage: 0.5 },
  { name: "Autorefinish", earning_percentage: 1 },
];

/**
 * Provision a brand-new organization and its single admin login.
 *
 * Super-admin only. Runs in trusted server code and is the one place allowed to
 * use the service-role key, because creating an Auth user requires the admin
 * API. Steps: create the org, seed its template, create the login, link the
 * profile. If a later step fails, earlier ones are rolled back best-effort so we
 * do not leave an orphaned org or login behind.
 */
export async function createOrganization(
  _prev: CreateOrgState,
  formData: FormData,
): Promise<CreateOrgState> {
  const values: CreateOrgValues = {
    name: String(formData.get("name") ?? "").trim(),
    admin_name: String(formData.get("admin_name") ?? "").trim(),
    brand_color: String(formData.get("brand_color") ?? "#c1121f").trim(),
    redemption_threshold: String(
      formData.get("redemption_threshold") ?? "10000",
    ).trim(),
    redemption_value: String(formData.get("redemption_value") ?? "1").trim(),
    admin_email: String(formData.get("admin_email") ?? "").trim(),
    admin_password: String(formData.get("admin_password") ?? ""),
  };

  const fail = (error: string): CreateOrgState => ({
    error,
    success: false,
    values,
  });

  // Only a super admin may create organizations.
  const profile = await getProfile();
  if (!profile || profile.role !== "super_admin") {
    return fail("You are not allowed to do this.");
  }

  // Validation.
  if (!values.name) return fail("Please enter an organization name.");
  if (!values.admin_email) return fail("Please enter the admin's email.");
  if (values.admin_password.length < 8) {
    return fail("The temporary password must be at least 8 characters.");
  }
  if (!HEX_COLOR.test(values.brand_color)) {
    return fail("Please choose a valid brand colour.");
  }
  const threshold = Number(values.redemption_threshold);
  const value = Number(values.redemption_value);
  if (Number.isNaN(threshold) || threshold < 0) {
    return fail("Please enter a threshold of zero or more.");
  }
  if (Number.isNaN(value) || value <= 0) {
    return fail("Please enter a redemption value greater than zero.");
  }

  const supabase = await createClient();
  const admin = createAdminClient();

  // 1. Create the organization (RLS allows this for the super admin).
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: values.name,
      admin_name: values.admin_name || null,
      brand_color: values.brand_color,
      redemption_threshold: threshold,
      redemption_value: value,
    })
    .select("id")
    .single();

  if (orgError || !org) {
    return fail("Could not create the organization. Please try again.");
  }

  // 2. Seed the starter categories for this org.
  const { error: seedError } = await supabase.from("paint_types").insert(
    DEFAULT_PAINT_TYPES.map((pt) => ({
      name: pt.name,
      earning_percentage: pt.earning_percentage,
      organization_id: org.id,
    })),
  );
  if (seedError) {
    await supabase.from("organizations").delete().eq("id", org.id);
    return fail("Could not set up the organization. Please try again.");
  }

  // 3. Create the admin login via the Auth admin API.
  const { data: created, error: userError } =
    await admin.auth.admin.createUser({
      email: values.admin_email,
      password: values.admin_password,
      email_confirm: true,
    });

  if (userError || !created?.user) {
    console.error("createOrganization: createUser failed", userError);
    await supabase.from("organizations").delete().eq("id", org.id);
    const already = userError?.message?.toLowerCase().includes("already");
    return fail(
      already
        ? "That email is already in use. Choose a different one."
        : "Could not create the admin login. Please try again.",
    );
  }

  // 4. Link the login to the org as its admin. Done with the signed-in super
  // admin's client (not the service-role one): the "profile manage" RLS policy
  // allows it, and `authenticated` holds the table grant, whereas `service_role`
  // was never granted these new tables in this project.
  const { error: profileError } = await supabase.from("profiles").insert({
    id: created.user.id,
    role: "org_admin",
    organization_id: org.id,
  });

  if (profileError) {
    console.error("createOrganization: profile insert failed", profileError);
    await admin.auth.admin.deleteUser(created.user.id);
    await supabase.from("organizations").delete().eq("id", org.id);
    return fail("Could not finish setting up the admin. Please try again.");
  }

  revalidatePath("/admin");
  return {
    error: null,
    success: true,
    values: { ...values, admin_password: "" },
  };
}

/**
 * Suspend or reactivate an organization. Super-admin only.
 */
export async function setOrganizationActive(
  id: string,
  active: boolean,
): Promise<void> {
  const profile = await getProfile();
  if (!profile || profile.role !== "super_admin") return;

  const supabase = await createClient();
  await supabase.from("organizations").update({ active }).eq("id", id);
  revalidatePath("/admin");
}

/**
 * Permanently delete an organization: its customers, transactions, categories,
 * and its admin login all go with it. Super-admin only, and irreversible.
 *
 * We grab the org's login accounts first, then delete the org (the database
 * cascades away all of its data and profile rows), then remove the leftover Auth
 * logins via the admin API so no orphaned sign in remains.
 */
export async function deleteOrganization(id: string): Promise<void> {
  const profile = await getProfile();
  if (!profile || profile.role !== "super_admin") return;

  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: members } = await supabase
    .from("profiles")
    .select("id")
    .eq("organization_id", id);

  const { error } = await supabase.from("organizations").delete().eq("id", id);
  if (error) {
    console.error("deleteOrganization: delete failed", error);
    return;
  }

  for (const member of members ?? []) {
    await admin.auth.admin.deleteUser(member.id);
  }

  revalidatePath("/admin");
}
