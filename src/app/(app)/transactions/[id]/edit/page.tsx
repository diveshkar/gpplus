import { notFound, redirect } from "next/navigation";
import { getTransactionById } from "@/lib/transactions/queries";
import { getCustomerById, getPaintTypes } from "@/lib/customers/queries";
import { EarnForm } from "@/components/transactions/earn-form";
import { PageHeader } from "@/components/ui/page-header";
import { FormAside } from "@/components/ui/form-aside";
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
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Edit transaction"
        description="Correcting this recalculates the points and adjusts the balance to match."
        backHref={`/customers/${customer.id}`}
        backLabel={`Back to ${customer.full_name}`}
      />

      <div className="grid gap-6 lg:grid-cols-2">
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

        <FormAside
          animation="/painting-and-decorating.json"
          title="Fix it with confidence"
          intro="Editing safely re-does the maths so the customer's balance stays correct."
          tips={[
            "Change the amount or paint type and points update to match.",
            "The old points are reversed and the new ones applied in one step.",
            "The original record stays in their activity for a clear audit trail.",
          ]}
        />
      </div>
    </div>
  );
}
