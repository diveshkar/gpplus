import { notFound } from "next/navigation";
import { getCustomerById, getPaintTypes } from "@/lib/customers/queries";
import { CustomerForm } from "@/components/customers/customer-form";
import { PageHeader } from "@/components/ui/page-header";
import { FormAside } from "@/components/ui/form-aside";
import { card } from "@/lib/ui";

export default async function EditCustomerPage({
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
        title="Edit customer"
        description={`Update ${customer.full_name}'s details.`}
        backHref={`/customers/${id}`}
        backLabel={`Back to ${customer.full_name}`}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={`${card} p-6`}>
          <CustomerForm
            mode="edit"
            customerId={id}
            paintTypes={paintTypes}
            cancelHref={`/customers/${id}`}
            initialValues={{
              full_name: customer.full_name,
              address: customer.address ?? "",
              date_of_birth: customer.date_of_birth ?? "",
              phone_number: customer.phone_number ?? "",
              default_paint_type_id: customer.default_paint_type_id ?? "",
              barcode_id: customer.barcode_id ?? "",
            }}
          />
        </div>

        <FormAside
          animation="/painting-and-decorating.json"
          title="Keep records tidy"
          intro="Correct a name, phone, or category any time. Points and card stay the same."
          tips={[
            "The card is not changed here; use the lost-card flow for that.",
            "Changing the category only affects future sales.",
          ]}
        />
      </div>
    </div>
  );
}
