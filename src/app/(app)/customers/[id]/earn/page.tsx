import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerById, getPaintTypes } from "@/lib/customers/queries";
import { EarnForm } from "@/components/transactions/earn-form";
import { card } from "@/lib/ui";

export default async function EarnPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [customer, paintTypes] = await Promise.all([
    getCustomerById(id),
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
          Add points
        </h1>
        <p className="mt-1 text-sm text-muted">
          Log a purchase for {customer.full_name} to earn points.
        </p>
      </div>

      <div className={`${card} p-6`}>
        <EarnForm
          customerId={customer.id}
          paintTypes={paintTypes}
          defaultPaintTypeId={customer.default_paint_type_id}
          cancelHref={`/customers/${customer.id}`}
        />
      </div>
    </div>
  );
}
