import { Suspense } from "react";
import Link from "next/link";
import {
  searchCustomersPaged,
  type CustomerSort,
  type SortDir,
} from "@/lib/customers/queries";
import { CustomerSearch } from "@/components/customers/customer-search";
import { PageHeader } from "@/components/ui/page-header";
import { LottiePlayer } from "@/components/ui/lottie-player";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  SortHeader,
  TableSkeleton,
} from "@/components/ui/table";
import { formatPoints } from "@/lib/format";
import { btnPrimary, card } from "@/lib/ui";

const PAGE_SIZE = 15;

function sortState(
  column: CustomerSort,
  sort: CustomerSort,
  dir: SortDir,
): "asc" | "desc" | "none" {
  return sort === column ? dir : "none";
}

// The data-fetching part, streamed inside a Suspense boundary so the page shell
// (heading and search) shows straight away and only this shows a skeleton while
// it loads or a search re-runs.
async function CustomersResults({
  q,
  page,
  sort,
  dir,
}: {
  q: string;
  page: number;
  sort: CustomerSort;
  dir: SortDir;
}) {
  const { customers, total } = await searchCustomersPaged(q, page, {
    pageSize: PAGE_SIZE,
    sort,
    dir,
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function sortHref(column: CustomerSort): string {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    next.set("sort", column);
    next.set("dir", sort === column ? (dir === "asc" ? "desc" : "asc") : "asc");
    return `/customers?${next.toString()}`;
  }

  if (customers.length === 0) {
    return (
      <div className={`${card} flex flex-col items-center gap-3 px-6 py-12 text-center`}>
        <LottiePlayer
          src={q ? "/car-wash.json" : "/home-decor.json"}
          className={q ? "mb-2 h-44 w-72" : "mb-2 h-60 w-60"}
        />
        <p className="text-base font-semibold text-foreground">
          {q ? "No customers match that search." : "Welcome to your loyalty program"}
        </p>
        <p className="max-w-xs text-sm text-muted">
          {q
            ? "Try a different name, phone number, or card."
            : "Register your first customer, or scan a new card to get started."}
        </p>
        {!q ? (
          <Link href="/customers/new" className={`${btnPrimary} mt-2`}>
            Add customer
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        {total} {total === 1 ? "customer" : "customers"}
        {q ? " matching your search" : ""}
      </p>

      <Table minWidth="min-w-full sm:min-w-[44rem]">
        <THead>
          <SortHeader
            label="Customer"
            state={sortState("name", sort, dir)}
            href={sortHref("name")}
          />
          <TH className="hidden sm:table-cell">Phone</TH>
          <TH className="hidden md:table-cell">Type</TH>
          <TH className="hidden lg:table-cell">Card</TH>
          <SortHeader
            label="Balance"
            state={sortState("balance", sort, dir)}
            href={sortHref("balance")}
            align="right"
          />
        </THead>
        <TBody>
          {customers.map((customer) => (
            <TR key={customer.id}>
              <TD>
                <Link
                  href={`/customers/${customer.id}`}
                  className="flex items-center gap-3 font-medium text-foreground transition-colors hover:text-brand"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand-strong">
                    {customer.full_name.charAt(0).toUpperCase()}
                  </span>
                  <span className="truncate">{customer.full_name}</span>
                </Link>
              </TD>
              <TD className="hidden text-muted sm:table-cell">
                {customer.phone_number ?? "No phone"}
              </TD>
              <TD className="hidden text-muted md:table-cell">
                {customer.default_paint_type?.name ?? "Not set"}
              </TD>
              <TD className="hidden lg:table-cell">
                <span
                  className={[
                    "rounded-full px-2.5 py-1 text-xs font-medium",
                    customer.barcode_id
                      ? "bg-background text-muted"
                      : "bg-warning/10 text-warning",
                  ].join(" ")}
                >
                  {customer.barcode_id ? "Card linked" : "No card"}
                </span>
              </TD>
              <TD align="right" className="font-semibold tabular-nums">
                {formatPoints(customer.points_balance)}
                <span className="ml-1 text-xs font-normal text-muted">pts</span>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>

      <Pagination currentPage={page} totalPages={totalPages} />
    </div>
  );
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    page?: string;
    sort?: string;
    dir?: string;
  }>;
}) {
  const params = await searchParams;
  const q = params.q ?? "";
  const parsedPage = Number(params.page);
  const page = Number.isInteger(parsedPage) && parsedPage >= 1 ? parsedPage : 1;
  const sort: CustomerSort =
    params.sort === "name" || params.sort === "balance" ? params.sort : "created";
  const dir: SortDir = params.dir === "asc" ? "asc" : "desc";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Customers"
        description="Find a customer, or scan their card to open it."
        actions={
          <Link href="/customers/new" className={btnPrimary}>
            Add customer
          </Link>
        }
      />

      <CustomerSearch initialQuery={q} />

      <Suspense
        key={`${q}|${page}|${sort}|${dir}`}
        fallback={<TableSkeleton columns={5} rows={8} />}
      >
        <CustomersResults q={q} page={page} sort={sort} dir={dir} />
      </Suspense>
    </div>
  );
}
