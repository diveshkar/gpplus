import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/profile";
import { AdminSignOut } from "@/components/admin/admin-signout";

/**
 * Platform admin layout. Only the super admin may enter; org admins and signed
 * out visitors are sent away. Deliberately a plain, focused chrome (no shop
 * sidebar or scanner) since this area manages organizations, not a shop.
 */
export default async function AdminLayout({
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
  if (profile?.role !== "super_admin") {
    redirect("/");
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/admin" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/loyalty-mark.svg" alt="" aria-hidden className="h-9 w-9" />
            <span className="flex flex-col leading-tight">
              <span className="font-heading text-base font-semibold tracking-tight text-foreground">
                Loyalty System
              </span>
              <span className="text-xs text-muted">Super admin</span>
            </span>
          </Link>

          <AdminSignOut email={user.email ?? ""} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 animate-fade-up px-5 py-8 sm:px-8">
        {children}
      </main>
    </div>
  );
}
