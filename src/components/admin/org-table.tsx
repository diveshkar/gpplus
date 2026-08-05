"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
import { OrgActiveToggle } from "@/components/admin/org-active-toggle";
import { OrgDeleteButton } from "@/components/admin/org-delete-button";
import { formatPoints } from "@/lib/format";
import { card, input } from "@/lib/ui";
import type { OrganizationWithStats } from "@/lib/organizations/queries";

type SortKey = "name" | "customers" | "points" | "active";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 10;

function lastActiveLabel(iso: string | null): string {
  if (!iso) return "No activity";
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function OrgTable({
  organizations,
}: {
  organizations: OrganizationWithStats[];
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
    setPage(1);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = q
      ? organizations.filter((org) => org.name.toLowerCase().includes(q))
      : organizations;

    return [...rows].sort((a, b) => {
      let diff = 0;
      if (sortKey === "name") diff = a.name.localeCompare(b.name);
      else if (sortKey === "customers")
        diff = a.customer_count - b.customer_count;
      else if (sortKey === "points")
        diff = a.points_liability - b.points_liability;
      else {
        const at = a.last_active ? new Date(a.last_active).getTime() : 0;
        const bt = b.last_active ? new Date(b.last_active).getTime() : 0;
        diff = at - bt;
      }
      return sortDir === "asc" ? diff : -diff;
    });
  }, [organizations, query, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  if (organizations.length === 0) {
    return (
      <div className={`${card} px-6 py-12 text-center`}>
        <p className="text-base font-semibold text-foreground">
          No organizations yet
        </p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          Create your first organization and its admin login to get started.
        </p>
        <Link href="/admin/new" className="mt-4 inline-block text-sm font-semibold text-brand hover:text-brand-strong">
          New organization
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden
        >
          <path
            d="m21 21-4.3-4.3M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          placeholder="Search organizations"
          className={`${input} pl-10`}
          aria-label="Search organizations"
        />
      </div>

      <Table minWidth="min-w-[52rem]">
        <THead>
          <SortHeader
            label="Organization"
            state={sortKey === "name" ? sortDir : "none"}
            onClick={() => toggleSort("name")}
          />
          <TH>Status</TH>
          <SortHeader
            label="Customers"
            state={sortKey === "customers" ? sortDir : "none"}
            onClick={() => toggleSort("customers")}
            align="right"
          />
          <SortHeader
            label="Points"
            state={sortKey === "points" ? sortDir : "none"}
            onClick={() => toggleSort("points")}
            align="right"
          />
          <SortHeader
            label="Last active"
            state={sortKey === "active" ? sortDir : "none"}
            onClick={() => toggleSort("active")}
          />
          <TH align="right">Actions</TH>
        </THead>
        <TBody>
          {pageRows.map((org) => (
            <TR key={org.id}>
              <TD>
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-white"
                    style={{ backgroundColor: org.brand_color }}
                  >
                    {org.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="font-medium text-foreground">
                    {org.name}
                  </span>
                </div>
              </TD>
              <TD>
                <span
                  className={[
                    "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                    org.active
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-neutral-100 text-muted",
                  ].join(" ")}
                >
                  {org.active ? "Active" : "Suspended"}
                </span>
              </TD>
              <TD align="right" className="tabular-nums">
                {org.customer_count.toLocaleString()}
              </TD>
              <TD align="right" className="tabular-nums">
                {formatPoints(org.points_liability)}
              </TD>
              <TD className="whitespace-nowrap text-muted">
                {lastActiveLabel(org.last_active)}
              </TD>
              <TD align="right">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/admin/${org.id}/edit`}
                    className="inline-flex h-8 items-center rounded-lg border border-border px-2.5 text-xs font-medium text-muted transition-colors hover:border-brand hover:text-brand"
                  >
                    Edit
                  </Link>
                  <OrgActiveToggle id={org.id} active={org.active} />
                  <OrgDeleteButton id={org.id} name={org.name} />
                </div>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>

      {filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">
          No organizations match your search.
        </p>
      ) : null}

      <ClientPagination
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
