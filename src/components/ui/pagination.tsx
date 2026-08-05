"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
      <path
        d="m15 18-6-6 6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
      <path
        d="m9 18 6-6-6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Work out which page numbers to show: always the first and last, the current
 * page and its neighbours, with an ellipsis marking any gap.
 */
function pageList(current: number, total: number): (number | "gap")[] {
  const result: (number | "gap")[] = [];
  const neighbours = 1;

  const start = Math.max(2, current - neighbours);
  const end = Math.min(total - 1, current + neighbours);

  result.push(1);
  if (start > 2) result.push("gap");
  for (let page = start; page <= end; page++) result.push(page);
  if (end < total - 1) result.push("gap");
  if (total > 1) result.push(total);

  return result;
}

const cellBase =
  "inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-medium transition-all";

export function Pagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function hrefFor(page: number): string {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) params.delete("page");
    else params.set("page", String(page));
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  const prevDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= totalPages;
  const pages = pageList(currentPage, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-3"
    >
      {prevDisabled ? (
        <span
          className={`${cellBase} cursor-not-allowed border-border bg-surface text-muted opacity-50`}
          aria-disabled
        >
          <ChevronLeft />
          <span className="ml-1 hidden sm:inline">Previous</span>
        </span>
      ) : (
        <Link
          href={hrefFor(currentPage - 1)}
          className={`${cellBase} border-border bg-surface text-foreground hover:border-brand hover:text-brand`}
        >
          <ChevronLeft />
          <span className="ml-1 hidden sm:inline">Previous</span>
        </Link>
      )}

      {/* Numbered pages on wider screens */}
      <div className="hidden items-center gap-1.5 sm:flex">
        {pages.map((page, index) =>
          page === "gap" ? (
            <span
              key={`gap-${index}`}
              className="px-1.5 text-sm text-muted"
              aria-hidden
            >
              …
            </span>
          ) : page === currentPage ? (
            <span
              key={page}
              aria-current="page"
              className={`${cellBase} border-brand bg-brand text-white shadow-sm`}
            >
              {page}
            </span>
          ) : (
            <Link
              key={page}
              href={hrefFor(page)}
              className={`${cellBase} border-border bg-surface text-foreground hover:border-brand hover:text-brand`}
            >
              {page}
            </Link>
          ),
        )}
      </div>

      {/* Compact indicator on small screens */}
      <span className="text-sm font-medium text-muted sm:hidden">
        Page {currentPage} of {totalPages}
      </span>

      {nextDisabled ? (
        <span
          className={`${cellBase} cursor-not-allowed border-border bg-surface text-muted opacity-50`}
          aria-disabled
        >
          <span className="mr-1 hidden sm:inline">Next</span>
          <ChevronRight />
        </span>
      ) : (
        <Link
          href={hrefFor(currentPage + 1)}
          className={`${cellBase} border-border bg-surface text-foreground hover:border-brand hover:text-brand`}
        >
          <span className="mr-1 hidden sm:inline">Next</span>
          <ChevronRight />
        </Link>
      )}
    </nav>
  );
}

/**
 * Client-side pagination, same look as Pagination but driven by a callback
 * instead of the URL. Used inside components that page an in-memory list.
 */
export function ClientPagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const prevDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= totalPages;
  const pages = pageList(currentPage, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-3"
    >
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={prevDisabled}
        className={`${cellBase} border-border bg-surface text-foreground transition-all hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:text-muted disabled:opacity-50 disabled:hover:border-border`}
      >
        <ChevronLeft />
        <span className="ml-1 hidden sm:inline">Previous</span>
      </button>

      <div className="hidden items-center gap-1.5 sm:flex">
        {pages.map((page, index) =>
          page === "gap" ? (
            <span
              key={`gap-${index}`}
              className="px-1.5 text-sm text-muted"
              aria-hidden
            >
              …
            </span>
          ) : page === currentPage ? (
            <span
              key={page}
              aria-current="page"
              className={`${cellBase} border-brand bg-brand text-white shadow-sm`}
            >
              {page}
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`${cellBase} border-border bg-surface text-foreground hover:border-brand hover:text-brand`}
            >
              {page}
            </button>
          ),
        )}
      </div>

      <span className="text-sm font-medium text-muted sm:hidden">
        Page {currentPage} of {totalPages}
      </span>

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={nextDisabled}
        className={`${cellBase} border-border bg-surface text-foreground transition-all hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:text-muted disabled:opacity-50 disabled:hover:border-border`}
      >
        <span className="mr-1 hidden sm:inline">Next</span>
        <ChevronRight />
      </button>
    </nav>
  );
}
