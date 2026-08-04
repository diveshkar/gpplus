/**
 * Reusable class strings so every screen shares the same premium look.
 * Changing these lifts the whole app at once.
 */

export const card =
  "rounded-[var(--radius-lg)] border border-border bg-surface shadow-card";

export const label = "text-sm font-medium text-foreground";

export const input =
  "h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm text-foreground placeholder:text-muted/70 transition-[border-color,box-shadow] focus:border-brand focus:ring-4 focus:ring-brand/10 focus:outline-none";

export const select = `${input} appearance-none pr-10`;

export const btnPrimary =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-brand-contrast shadow-sm transition-all hover:bg-brand-strong active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:active:scale-100";

export const btnSecondary =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-medium text-foreground transition-all hover:border-brand hover:text-brand active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70";

export const btnGhost =
  "inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-muted transition-colors hover:bg-background hover:text-foreground";

export const btnDanger =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-danger px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:active:scale-100";

export const errorAlert =
  "rounded-xl border border-danger/20 bg-danger/5 px-3.5 py-2.5 text-sm text-danger";
