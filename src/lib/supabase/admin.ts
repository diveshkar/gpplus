import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client authenticated with the SERVICE-ROLE key.
 *
 * This bypasses Row Level Security entirely, so it is powerful and dangerous:
 * it may ONLY be used in trusted server code (Server Actions / Route Handlers)
 * and its key must never reach the browser. It exists for one job that the
 * normal client cannot do: provisioning organization admin logins via the Auth
 * admin API. All ordinary reads and writes must keep using the request-scoped
 * client in ./server.ts so RLS stays in force.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it to your server environment.",
    );
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
