import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/auth/actions";

/**
 * Protected layout for the admin panel.
 *
 * Every page inside the (app) route group renders through here. We verify the
 * signed-in user server-side on each request and send anyone who is not signed
 * in back to the login screen. This runs in addition to the proxy check, so the
 * panel stays protected even if the proxy is ever bypassed.
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

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <Image
              src="/gppluslogo.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
              aria-hidden
            />
            <span className="font-heading text-base font-semibold tracking-tight text-foreground">
              GP+ Loyalty
            </span>
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-3.5 text-sm font-medium text-foreground transition-colors hover:border-brand hover:text-brand"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">
        {children}
      </main>
    </div>
  );
}
