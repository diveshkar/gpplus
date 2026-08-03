import Link from "next/link";
import { searchCustomers } from "@/lib/customers/queries";
import { CustomerSearch } from "@/components/customers/customer-search";
import { formatPoints } from "@/lib/format";
import { btnPrimary, card } from "@/lib/ui";
import type { CustomerWithPaintType } from "@/lib/types";

function CustomerRow({ customer }: { customer: CustomerWithPaintType }) {
  return (
    <Link
      href={`/customers/${customer.id}`}
      className="flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-background"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand-strong">
          {customer.full_name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {customer.full_name}
          </p>
          <p className="truncate text-xs text-muted">
            {customer.phone_number ?? "No phone"}
            {customer.default_paint_type?.name
              ? ` · ${customer.default_paint_type.name}`
              : ""}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span
          className={[
            "hidden rounded-full px-2.5 py-1 text-xs font-medium sm:inline-block",
            customer.barcode_id
              ? "bg-background text-muted"
              : "bg-warning/10 text-warning",
          ].join(" ")}
        >
          {customer.barcode_id ? "Card linked" : "No card"}
        </span>
        <span className="text-right text-sm font-semibold text-foreground">
          {formatPoints(customer.points_balance)}
          <span className="ml-1 text-xs font-normal text-muted">pts</span>
        </span>
      </div>
    </Link>
  );
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const customers = await searchCustomers(q);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Customers
          </h1>
          <p className="mt-1 text-sm text-muted">
            Find a customer, or scan their card to open it.
          </p>
        </div>
        <Link href="/customers/new" className={btnPrimary}>
          Add customer
        </Link>
      </div>

      <CustomerSearch initialQuery={q} />

      {customers.length === 0 ? (
        <div className={`${card} flex flex-col items-center gap-2 px-6 py-14 text-center`}>
          <p className="text-sm font-medium text-foreground">
            {q ? "No customers match that search." : "No customers yet."}
          </p>
          <p className="max-w-xs text-sm text-muted">
            {q
              ? "Try a different name, phone number, or card."
              : "Add your first customer, or scan a new card to get started."}
          </p>
          {!q ? (
            <Link href="/customers/new" className={`${btnPrimary} mt-2`}>
              Add customer
            </Link>
          ) : null}
        </div>
      ) : (
        <div className={`${card} divide-y divide-border overflow-hidden`}>
          {customers.map((customer) => (
            <CustomerRow key={customer.id} customer={customer} />
          ))}
        </div>
      )}
    </div>
  );
}
