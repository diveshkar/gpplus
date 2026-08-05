import { notFound } from "next/navigation";
import { getCustomerById } from "@/lib/customers/queries";
import { getCurrentOrganization } from "@/lib/organizations/queries";
import { RedeemForm } from "@/components/transactions/redeem-form";
import { PageHeader } from "@/components/ui/page-header";
import { FormAside } from "@/components/ui/form-aside";
import { card } from "@/lib/ui";

export default async function RedeemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [customer, config] = await Promise.all([
    getCustomerById(id),
    getCurrentOrganization(),
  ]);

  if (!customer) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Redeem points"
        description={`Give ${customer.full_name} a product in exchange for points.`}
        backHref={`/customers/${customer.id}`}
        backLabel={`Back to ${customer.full_name}`}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={`${card} p-6`}>
          <RedeemForm
            customerId={customer.id}
            balance={customer.points_balance}
            threshold={config.redemption_threshold}
            value={config.redemption_value}
            cancelHref={`/customers/${customer.id}`}
          />
        </div>

        <FormAside
          animation="/home-decor.json"
          title="A reward well earned"
          intro="Redeeming converts points into product value at your current rate."
          tips={[
            "Customers can redeem once they pass the points threshold.",
            "The balance drops by the points you redeem, straight away.",
            "Every redemption is kept in their activity for the record.",
          ]}
        />
      </div>
    </div>
  );
}
