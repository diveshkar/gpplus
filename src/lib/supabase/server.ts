import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for use on the server (Server Components, Route Handlers,
 * Server Actions). It reads and writes the auth session through cookies, so
 * a logged-in admin stays logged in across requests.
 *
 * Must be created per-request because it depends on the incoming cookies.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // `setAll` can be called from a Server Component, where writing
            // cookies is not allowed. This is safe to ignore when the session
            // is being refreshed by middleware instead (added in Phase 1).
          }
        },
      },
    },
  );
}
