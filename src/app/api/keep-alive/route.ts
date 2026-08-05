import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Never cache this route; it must actually hit the database on every call.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Keep-alive endpoint.
 *
 * A free external scheduler (cron-job.org, UptimeRobot, or a GitHub Actions
 * cron) calls this once a day for BOTH the stage and prod deployments. Running
 * a tiny query resets Supabase's "idle" timer, so the free-tier project never
 * hits the ~7-day auto-pause, whether the shop is open or closed.
 *
 * This keeps the database AWAKE. It is NOT a backup; protecting the data is a
 * separate concern handled by the on-demand Excel export (Phase 6).
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.json(
      { ok: false, reason: "Supabase environment variables are not set." },
      { status: 503 },
    );
  }

  const supabase = createClient(url, anonKey);

  // Touch the database with the lightest possible read. The keep-alive uses the
  // anonymous key, which is intentionally denied by Row Level Security, so any
  // structured response (including "table not found" or "permission denied")
  // still proves the database was reached. That is all the keep-alive needs.
  const { error } = await supabase
    .from("organizations")
    .select("*", { count: "exact", head: true });

  // Codes that still mean the database answered: undefined_table and
  // insufficient_privilege.
  const reached = !error || error.code === "42P01" || error.code === "42501";

  if (!reached) {
    return NextResponse.json(
      { ok: false, reason: error.message },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    pingedAt: new Date().toISOString(),
    note: "Database reached.",
  });
}
