import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerById } from "@/lib/customers/queries";
import { getConfiguration } from "@/lib/settings/queries";
import { RedeemForm } from "@/components/transactions/redeem-form";
import { card } from "@/lib/ui";

export default async function RedeemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [customer, config] = await Promise.all([
    getCustomerById(id),
    getConfiguration(),
  ]);

  if (!customer) {
    notFound();
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <Link
          href={`/customers/${customer.id}`}
          className="text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          Back to {customer.full_name}
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground">
          Redeem points
        </h1>
        <p className="mt-1 text-sm text-muted">
          Give {customer.full_name} a product in exchange for points.
        </p>
      </div>

      <div className={`${card} p-6`}>
        <RedeemForm
          customerId={customer.id}
          balance={customer.points_balance}
          threshold={config.redemption_threshold}
          value={config.redemption_value}
          cancelHref={`/customers/${customer.id}`}
        />
      </div>
    </div>
  );
}
