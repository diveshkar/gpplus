import { notFound } from "next/navigation";
import { getCustomerById, getPaintTypes } from "@/lib/customers/queries";
import { EarnForm } from "@/components/transactions/earn-form";
import { PageHeader } from "@/components/ui/page-header";
import { FormAside } from "@/components/ui/form-aside";
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
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Add points"
        description={`Log a purchase for ${customer.full_name} to earn points.`}
        backHref={`/customers/${customer.id}`}
        backLabel={`Back to ${customer.full_name}`}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={`${card} p-6`}>
          <EarnForm
            customerId={customer.id}
            paintTypes={paintTypes}
            defaultPaintTypeId={customer.default_paint_type_id}
            cancelHref={`/customers/${customer.id}`}
          />
        </div>

        <FormAside
          animation="/painting-and-decorating.json"
          title="Reward every purchase"
          intro="Points are worked out from the sale amount and the paint type's rate."
          tips={[
            "Pick the paint type so the correct rate applies.",
            "Add a short note to make the receipt easy to recognise later.",
            "Points are added to the balance the moment you save.",
          ]}
        />
      </div>
    </div>
  );
}
