import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerById } from "@/lib/customers/queries";
import { formatDate, formatPoints } from "@/lib/format";
import { card } from "@/lib/ui";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-right text-sm font-medium text-foreground">
        {value}
      </span>
    </div>
  );
}

export default async function CustomerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomerById(id);

  if (!customer) {
    notFound();
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Link
          href="/customers"
          className="text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          Back to customers
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-lg font-semibold text-brand-strong">
          {customer.full_name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h1 className="truncate font-heading text-2xl font-semibold tracking-tight text-foreground">
            {customer.full_name}
          </h1>
          <p className="text-sm text-muted">
            {customer.default_paint_type?.name
              ? `${customer.default_paint_type.name} customer`
              : "No customer type set"}
          </p>
        </div>
      </div>

      {/* Balance */}
      <div className={`${card} flex items-center justify-between p-6`}>
        <div>
          <p className="text-sm text-muted">Current balance</p>
          <p className="mt-1 font-heading text-3xl font-semibold tracking-tight text-foreground">
            {formatPoints(customer.points_balance)}
            <span className="ml-1.5 text-base font-normal text-muted">
              points
            </span>
          </p>
        </div>
        <span
          className={[
            "rounded-full px-3 py-1.5 text-xs font-medium",
            customer.barcode_id
              ? "bg-background text-muted"
              : "bg-warning/10 text-warning",
          ].join(" ")}
        >
          {customer.barcode_id ? "Card linked" : "No card linked"}
        </span>
      </div>

      {/* Details */}
      <div className={`${card} px-6 py-2`}>
        <div className="divide-y divide-border">
          <DetailRow
            label="Phone"
            value={customer.phone_number ?? "Not set"}
          />
          <DetailRow
            label="Date of birth"
            value={formatDate(customer.date_of_birth)}
          />
          <DetailRow label="Address" value={customer.address ?? "Not set"} />
          <DetailRow
            label="Card barcode"
            value={customer.barcode_id ?? "No card linked"}
          />
        </div>
      </div>

      {/* History placeholder for Phase 3 */}
      <div className={`${card} flex flex-col items-center gap-1 px-6 py-10 text-center`}>
        <p className="text-sm font-medium text-foreground">
          No activity yet
        </p>
        <p className="max-w-xs text-sm text-muted">
          Earning and redeeming points arrives in the next phase. Their full
          history will show here.
        </p>
      </div>
    </div>
  );
}
