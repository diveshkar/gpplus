import Link from "next/link";

/**
 * Styled table primitives on the design system. Server-compatible (no hooks), so
 * they work in server pages (Customers) and client components (Transactions)
 * alike. They give a consistent professional table everywhere: sticky header,
 * hover highlight, clean spacing, and responsive horizontal scroll.
 */

type Align = "left" | "right" | "center";

function alignClass(align?: Align): string {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
}

export function Table({
  children,
  minWidth = "min-w-[38rem]",
}: {
  children: React.ReactNode;
  minWidth?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border bg-surface shadow-card">
      <table className={`w-full ${minWidth} border-collapse text-sm`}>
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="border-b border-border bg-background">
      <tr>{children}</tr>
    </thead>
  );
}

export function TH({
  children,
  align,
  className = "",
}: {
  children?: React.ReactNode;
  align?: Align;
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={`sticky top-0 bg-background px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted ${alignClass(
        align,
      )} ${className}`}
    >
      {children}
    </th>
  );
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-border">{children}</tbody>;
}

export function TR({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <tr className={`transition-colors hover:bg-background ${className}`}>
      {children}
    </tr>
  );
}

export function TD({
  children,
  align,
  className = "",
}: {
  children?: React.ReactNode;
  align?: Align;
  className?: string;
}) {
  return (
    <td className={`px-4 py-4 text-foreground ${alignClass(align)} ${className}`}>
      {children}
    </td>
  );
}

function SortArrows({ state }: { state: "asc" | "desc" | "none" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-3.5 w-3.5"
      aria-hidden
    >
      <path
        d="m8 10 4-4 4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={state === "asc" ? "text-brand" : "text-muted/50"}
      />
      <path
        d="m8 14 4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={state === "desc" ? "text-brand" : "text-muted/50"}
      />
    </svg>
  );
}

/**
 * A sortable column header. Provide `href` for server-driven sorting (a Link) or
 * `onClick` for client-driven sorting (a button). `state` shows the arrows.
 */
export function SortHeader({
  label,
  state,
  href,
  onClick,
  align,
}: {
  label: string;
  state: "asc" | "desc" | "none";
  href?: string;
  onClick?: () => void;
  align?: Align;
}) {
  const inner = (
    <span
      className={`inline-flex items-center gap-1.5 ${
        align === "right" ? "flex-row-reverse" : ""
      } ${state !== "none" ? "text-foreground" : ""}`}
    >
      {label}
      <SortArrows state={state} />
    </span>
  );

  // Keep the header label sitting directly above its data cells: right-aligned
  // columns push the label to the end, centered columns to the middle.
  const justify =
    align === "right"
      ? "justify-end"
      : align === "center"
        ? "justify-center"
        : "justify-start";

  if (href) {
    return (
      <TH align={align} className="p-0">
        <Link
          href={href}
          className={`flex w-full items-center ${justify} px-4 py-3.5 transition-colors hover:text-foreground`}
        >
          {inner}
        </Link>
      </TH>
    );
  }

  return (
    <TH align={align} className="p-0">
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center ${justify} px-4 py-3.5 transition-colors hover:text-foreground`}
      >
        {inner}
      </button>
    </TH>
  );
}

/**
 * A loading skeleton matching the table shape, for Suspense fallbacks.
 */
export function TableSkeleton({
  columns,
  rows = 8,
}: {
  columns: number;
  rows?: number;
}) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-card">
      <div className="flex gap-4 border-b border-border px-4 py-3">
        {Array.from({ length: columns }).map((_, index) => (
          <div
            key={index}
            className="h-3 flex-1 animate-pulse rounded bg-border"
          />
        ))}
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-4 px-4 py-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div
                key={colIndex}
                className="h-3.5 flex-1 animate-pulse rounded bg-border"
                style={{ animationDelay: `${rowIndex * 60}ms` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
