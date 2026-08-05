import { getPaintTypes } from "@/lib/customers/queries";
import { CustomerForm } from "@/components/customers/customer-form";
import { PageHeader } from "@/components/ui/page-header";
import { FormAside } from "@/components/ui/form-aside";
import { card } from "@/lib/ui";

export default async function NewCustomerPage({
  searchParams,
}: {
  searchParams: Promise<{ barcode?: string }>;
}) {
  const { barcode = "" } = await searchParams;
  const paintTypes = await getPaintTypes();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Add a customer"
        description="Register a new customer and, if you have their card, link it now."
        backHref="/customers"
        backLabel="Back to customers"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={`${card} p-6`}>
          <CustomerForm paintTypes={paintTypes} initialBarcode={barcode} />
        </div>

        <FormAside
          animation="/painting-and-decorating.json"
          title="Welcome a new regular"
          intro="Set them up once and every future visit earns points automatically."
          tips={[
            "Only a name is required. Everything else can be added later.",
            "Scan or type their card number to link it from day one.",
            "Choosing their usual category speeds up logging sales.",
          ]}
        />
      </div>
    </div>
  );
}
