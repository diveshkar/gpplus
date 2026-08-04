import Link from "next/link";

/**
 * The standard header used at the top of every screen.
 *
 * It gives the whole app one consistent, premium masthead: an icon-only back
 * button, a prominent title, an optional supporting line, and a slot for page
 * actions (e.g. "Add customer"). Server-compatible (no hooks) so it drops into
 * any page or layout.
 *
 * The back button points at the Dashboard by default. Deep pages can override
 * `backHref`/`backLabel` to return to a more useful parent (e.g. the customer
 * they came from) while keeping the same look everywhere.
 */
export function PageHeader({
  title,
  description,
  backHref = "/",
  backLabel,
  leading,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  /** Where the back button goes. Defaults to the Dashboard. */
  backHref?: string;
  /** Accessible label / tooltip for the back button. */
  backLabel?: string;
  /** Optional element shown before the title, e.g. a customer avatar. */
  leading?: React.ReactNode;
  /** Optional actions shown on the right, e.g. buttons. */
  actions?: React.ReactNode;
}) {
  const isDashboard = backHref === "/";
  const label = backLabel ?? (isDashboard ? "Back to dashboard" : "Go back");

  return (
    <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-[var(--radius-lg)] border border-border bg-surface px-4 py-4 shadow-card sm:px-5">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <Link
          href={backHref}
          aria-label={label}
          title={label}
          className="group inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-muted shadow-card transition-all hover:border-brand hover:text-brand active:scale-95"
        >
          {isDashboard ? (
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
              <path
                d="M3 10.5 12 3l9 7.5M5.25 9v10.5a.75.75 0 0 0 .75.75h3.75V15a1.5 1.5 0 0 1 1.5-1.5h1.5A1.5 1.5 0 0 1 14.25 15v5.25H18a.75.75 0 0 0 .75-.75V9"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5 transition-transform group-hover:-translate-x-0.5"
              aria-hidden
            >
              <path
                d="m15 18-6-6 6-6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </Link>

        {leading}

        <div className="min-w-0">
          <h1 className="truncate font-heading text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {description ? (
            <p className="mt-0.5 text-sm text-muted">{description}</p>
          ) : null}
        </div>
      </div>

      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
