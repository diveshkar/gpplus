import Link from "next/link";

/**
 * Consistent back navigation link with a chevron, used across detail and form
 * pages so "go back" always looks and behaves the same.
 */
export function BackLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
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
      {children}
    </Link>
  );
}
