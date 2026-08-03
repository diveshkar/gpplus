import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { card } from "@/lib/ui";

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

  const name = user?.email?.split("@")[0] ?? "there";

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          {greeting()}, {name}.
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Scan a card to open a customer, or pick up where you left off.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/customers"
          className={`${card} flex flex-col gap-1.5 p-6 transition-colors hover:border-brand`}
        >
          <span className="text-sm font-semibold text-foreground">
            Customers
          </span>
          <span className="text-sm text-muted">
            Search everyone, or open a profile to see their balance.
          </span>
        </Link>

        <Link
          href="/customers/new"
          className={`${card} flex flex-col gap-1.5 p-6 transition-colors hover:border-brand`}
        >
          <span className="text-sm font-semibold text-foreground">
            Add a customer
          </span>
          <span className="text-sm text-muted">
            Register someone new and link their loyalty card.
          </span>
        </Link>
      </section>

      <section className={`${card} p-6`}>
        <h2 className="text-sm font-semibold text-foreground">Up next</h2>
        <p className="mt-1 text-sm text-muted">
          Phase 3 brings earning and redeeming points. The Scan button will then
          let you log a sale in one step, straight from any screen.
        </p>
      </section>
    </div>
  );
}
