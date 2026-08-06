import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/app-shell";
import { getPaintTypes } from "@/lib/customers/queries";
import { getProfile } from "@/lib/auth/profile";
import { getCurrentOrganization } from "@/lib/organizations/queries";

/**
 * Protected layout for a shop's admin panel.
 *
 * Verifies the signed-in user server-side on every request. Anyone not signed
 * in goes to the login screen; the platform super admin is sent to their own
 * admin area. Everyone else is an org admin, so we load their organization's
 * settings and branding and hand them the shop shell.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getProfile();
  if (profile?.role === "super_admin") {
    redirect("/admin");
  }
  if (!profile) {
    // Signed in but not attached to any organization yet.
    redirect("/login?toast=no_org");
  }

  const [paintTypes, org] = await Promise.all([
    getPaintTypes(),
    getCurrentOrganization(),
  ]);

  // A suspended organization cannot use the shop.
  if (!org.active) {
    redirect("/login?toast=suspended");
  }

  return (
    <AppShell
      userEmail={user.email ?? ""}
      displayName={org.admin_name?.trim() || org.name}
      paintTypes={paintTypes}
      config={{
        redemption_threshold: org.redemption_threshold,
        redemption_value: org.redemption_value,
      }}
      logoUrl={org.logo_url}
      brandColor={org.brand_color}
      cardsEnabled={org.cards_enabled}
    >
      {children}
    </AppShell>
  );
}
