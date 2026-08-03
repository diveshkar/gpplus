import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/app-shell";
import { getPaintTypes } from "@/lib/customers/queries";

/**
 * Protected layout for the admin panel.
 *
 * Verifies the signed-in user server-side on every request and sends anyone who
 * is not signed in back to the login screen. This runs in addition to the proxy
 * check, so the panel stays protected even if the proxy is ever bypassed.
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

  const paintTypes = await getPaintTypes();

  return (
    <AppShell userEmail={user.email ?? ""} paintTypes={paintTypes}>
      {children}
    </AppShell>
  );
}
