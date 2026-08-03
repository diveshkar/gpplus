import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Never cache this route — it must actually hit the database on every call.
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
 * This keeps the database AWAKE. It is NOT a backup — protecting the data is a
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

  // Touch the database with the lightest possible read. The `configuration`
  // table is created in Phase 1; until then the request still reaches the
  // database (which is all the keep-alive needs), so a "table not found"
  // error is treated as a successful ping.
  const { error } = await supabase
    .from("configuration")
    .select("*", { count: "exact", head: true });

  const tableMissing = error?.code === "42P01"; // undefined_table

  if (error && !tableMissing) {
    return NextResponse.json(
      { ok: false, reason: error.message },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    pingedAt: new Date().toISOString(),
    note: tableMissing
      ? "Database reached (configuration table not created yet — expected before Phase 1)."
      : "Database reached.",
  });
}
