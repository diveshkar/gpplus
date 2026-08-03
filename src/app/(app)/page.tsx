import { createClient } from "@/lib/supabase/server";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function AdminHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Show the part of the email before the @ as a light, friendly touch.
  const name = user?.email?.split("@")[0] ?? "there";

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          {greeting()}, {name}.
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          You are signed in to the GP+ loyalty desk. The counter tools land in
          the next phase.
        </p>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
        <h2 className="text-sm font-semibold text-foreground">Up next</h2>
        <p className="mt-1 text-sm text-muted">
          Phase 2 brings customer registration, barcode card linking, and quick
          scan lookup. For now the foundation is in place: secure login, the
          database, and this protected admin shell.
        </p>
      </section>
    </div>
  );
}
