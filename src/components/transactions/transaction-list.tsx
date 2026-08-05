"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { voidTransaction } from "@/lib/transactions/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  SortHeader,
} from "@/components/ui/table";
import { ClientPagination } from "@/components/ui/pagination";
import { formatDate, formatLKR, formatPoints } from "@/lib/format";
import type { TransactionRow } from "@/lib/transactions/queries";

type SortKey = "date" | "points";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 8;

// Each activity type gets its own consistent, accessible colour so the table is
// easy to scan at a glance.
function EntryBadge({ row }: { row: TransactionRow }) {
  if (row.voided) {
    return (
      <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-muted line-through">
        Cancelled
      </span>
    );
  }
  if (row.entry_type === "earn") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
        Earn
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
      Redeem
    </span>
  );
}

function RowActions({
  row,
  customerId,
}: {
  row: TransactionRow;
  customerId: string;
}) {
  const router = useRouter();
  if (row.voided) return null;

  return (
    <div className="flex items-center justify-end gap-1">
      {row.entry_type === "earn" ? (
        <Link
          href={`/transactions/${row.id}/edit`}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-background hover:text-foreground"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden>
            <path
              d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Edit
        </Link>
      ) : null}
      <ConfirmDialog
        title="Void this transaction?"
        description="It will be marked cancelled and its points reversed. The record is kept for audit."
        confirmLabel="Void"
        variant="danger"
        onConfirm={async () => {
          await voidTransaction(row.id, customerId);
          router.refresh();
          toast.success("Transaction voided");
        }}
        trigger={
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-danger/5 hover:text-danger"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden>
              <path
                d="M18 6 6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            Void
          </button>
        }
      />
    </div>
  );
}

export function TransactionList({
  transactions,
  customerId,
}: {
  transactions: TransactionRow[];
  customerId: string;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
  }

  const sorted = useMemo(() => {
    const copy = [...transactions];
    copy.sort((a, b) => {
      const diff =
        sortKey === "points"
          ? a.points - b.points
          : new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime();
      return sortDir === "asc" ? diff : -diff;
    });
    return copy;
  }, [transactions, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  return (
    <div className="flex flex-col gap-4">
      <Table minWidth="min-w-full sm:min-w-[52rem]">
        <THead>
          <SortHeader
            label="Date"
            state={sortKey === "date" ? sortDir : "none"}
            onClick={() => toggleSort("date")}
          />
          <TH>Type</TH>
          <TH>Description</TH>
          <TH className="hidden md:table-cell" align="right">
            Amount
          </TH>
          <SortHeader
            label="Points"
            state={sortKey === "points" ? sortDir : "none"}
            onClick={() => toggleSort("points")}
            align="right"
          />
          <TH align="right">Actions</TH>
        </THead>
        <TBody>
          {pageRows.map((row) => {
            const isEarn = row.entry_type === "earn";
            const pointsLabel = `${row.points > 0 ? "+" : ""}${formatPoints(
              row.points,
            )}`;
            return (
              <TR key={row.id}>
                <TD className="whitespace-nowrap text-muted">
                  {formatDate(row.created_at)}
                </TD>
                <TD>
                  <EntryBadge row={row} />
                </TD>
                <TD
                  className={
                    row.voided
                      ? "max-w-[18rem] truncate text-muted line-through"
                      : "max-w-[18rem] truncate text-foreground"
                  }
                >
                  {row.description ?? (isEarn ? "Purchase" : "Redemption")}
                </TD>
                <TD className="hidden text-muted md:table-cell" align="right">
                  {formatLKR(row.amount)}
                </TD>
                <TD
                  align="right"
                  className={[
                    "font-semibold tabular-nums",
                    row.voided
                      ? "text-muted line-through"
                      : isEarn
                        ? "text-emerald-600"
                        : "text-amber-600",
                  ].join(" ")}
                >
                  {pointsLabel}
                </TD>
                <TD align="right">
                  <RowActions row={row} customerId={customerId} />
                </TD>
              </TR>
            );
          })}
        </TBody>
      </Table>

      <ClientPagination
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
