import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTransactionById } from "@/lib/transactions/queries";
import { getCustomerById, getPaintTypes } from "@/lib/customers/queries";
import { EarnForm } from "@/components/transactions/earn-form";
import { card } from "@/lib/ui";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const transaction = await getTransactionById(id);

  if (!transaction) {
    notFound();
  }

  // Only live earn rows are editable here. Cancelled rows and redeem rows are
  // handled elsewhere, so send the admin back to the profile.
  if (transaction.voided || transaction.entry_type !== "earn") {
    redirect(`/customers/${transaction.customer_id}`);
  }

  const [customer, paintTypes] = await Promise.all([
    getCustomerById(transaction.customer_id),
    getPaintTypes(),
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
          Edit transaction
        </h1>
        <p className="mt-1 text-sm text-muted">
          Correcting this recalculates the points and adjusts the balance to
          match.
        </p>
      </div>

      <div className={`${card} p-6`}>
        <EarnForm
          mode="edit"
          transactionId={transaction.id}
          customerId={transaction.customer_id}
          paintTypes={paintTypes}
          defaultPaintTypeId={transaction.paint_type_id}
          initialAmount={String(transaction.amount)}
          initialDescription={transaction.description ?? ""}
          cancelHref={`/customers/${customer.id}`}
        />
      </div>
    </div>
  );
}
