import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { LottiePlayer } from "@/components/ui/lottie-player";
import { getCustomerById } from "@/lib/customers/queries";
import {
  getCustomerTransactions,
  expectedBalance,
} from "@/lib/transactions/queries";
import { getCurrentOrganization } from "@/lib/organizations/queries";
import { TransactionList } from "@/components/transactions/transaction-list";
import { formatDate, formatLKR, formatPoints } from "@/lib/format";
import { btnPrimary, btnSecondary, card } from "@/lib/ui";

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
  const [customer, transactions, config] = await Promise.all([
    getCustomerById(id),
    getCustomerTransactions(id),
    getCurrentOrganization(),
  ]);

  if (!customer) {
    notFound();
  }

  const expected = expectedBalance(transactions);
  const hasDrift = Math.abs(expected - customer.points_balance) > 0.0001;
  const worth = customer.points_balance * config.redemption_value;
  const canRedeem =
    customer.points_balance >= config.redemption_threshold;
  const firstName = customer.full_name.split(" ")[0];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={customer.full_name}
        description={
          customer.default_paint_type?.name
            ? `${customer.default_paint_type.name} customer`
            : "No customer type set"
        }
        backHref="/customers"
        backLabel="Back to customers"
        leading={
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-soft text-lg font-semibold text-brand-strong">
            {customer.full_name.charAt(0).toUpperCase()}
          </div>
        }
      />

      {/* Drift warning (Rule 6) */}
      {hasDrift ? (
        <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          <p className="font-medium">Balance needs a check</p>
          <p className="mt-0.5">
            The stored balance ({formatPoints(customer.points_balance)}) does not
            match the sum of this customer&apos;s activity (
            {formatPoints(expected)}). Please review before making changes.
          </p>
        </div>
      ) : null}

      {/* Threshold reached, a small human touch */}
      {canRedeem ? (
        <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-brand/20 bg-brand-soft px-4 py-3.5">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="mt-0.5 h-5 w-5 shrink-0 text-brand"
            aria-hidden
          >
            <path
              d="M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7ZM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div>
            <p className="text-sm font-semibold text-brand-strong">
              {firstName} can redeem a reward
            </p>
            <p className="mt-0.5 text-sm text-brand-strong/80">
              They have crossed {formatPoints(config.redemption_threshold)}{" "}
              points. Nice work keeping them coming back.
            </p>
          </div>
        </div>
      ) : null}

      {/* Balance */}
      <div className={`${card} flex flex-wrap items-center justify-between gap-4 p-6`}>
        <div>
          <p className="text-sm text-muted">Current balance</p>
          <p className="mt-1 font-heading text-3xl font-semibold tracking-tight text-foreground">
            {formatPoints(customer.points_balance)}
            <span className="ml-1.5 text-base font-normal text-muted">
              points
            </span>
          </p>
          <p className="mt-1 text-sm text-muted">
            Worth {formatLKR(worth)} toward a product
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/customers/${customer.id}/earn`} className={btnPrimary}>
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
              />
            </svg>
            Add points
          </Link>
          <Link
            href={`/customers/${customer.id}/redeem`}
            className={btnSecondary}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
              <path
                d="M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7ZM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Redeem
          </Link>
        </div>
      </div>

      {/* Details */}
      <div className={`${card} px-6 py-2`}>
        <div className="divide-y divide-border">
          <DetailRow label="Phone" value={customer.phone_number ?? "Not set"} />
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

      {/* History */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">Activity</h2>
        {transactions.length === 0 ? (
          <div className={`${card} flex flex-col items-center gap-1 px-6 py-8 text-center`}>
            <LottiePlayer
              src="/painting-and-decorating.json"
              className="h-52 w-52"
            />
            <p className="text-sm font-medium text-foreground">No activity yet</p>
            <p className="max-w-xs text-sm text-muted">
              Add points from a purchase, or scan their card to log a sale in one
              step.
            </p>
          </div>
        ) : (
          <TransactionList transactions={transactions} customerId={customer.id} />
        )}
      </div>
    </div>
  );
}
