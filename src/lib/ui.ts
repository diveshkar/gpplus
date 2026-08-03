/**
 * Reusable class strings so every screen shares the same look.
 *
 * This is the lightweight foundation. The full design-system pass, including
 * the animated loading component, lands in Phase 7.
 */

export const card =
  "rounded-[var(--radius-lg)] border border-border bg-surface";

export const label = "text-sm font-medium text-foreground";

export const input =
  "h-11 w-full rounded-lg border border-border bg-background px-3.5 text-sm text-foreground placeholder:text-muted/70 transition-colors focus:border-brand";

export const select = `${input} appearance-none pr-10`;

export const btnPrimary =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-contrast transition-colors hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-70";

export const btnSecondary =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:border-brand hover:text-brand";

export const btnGhost =
  "inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-muted transition-colors hover:bg-background hover:text-foreground";

export const errorAlert =
  "rounded-lg border border-danger/20 bg-danger/5 px-3.5 py-2.5 text-sm text-danger";
