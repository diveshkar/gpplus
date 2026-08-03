import Link from "next/link";
import { getPaintTypes } from "@/lib/customers/queries";
import { CustomerForm } from "@/components/customers/customer-form";
import { card } from "@/lib/ui";

export default async function NewCustomerPage({
  searchParams,
}: {
  searchParams: Promise<{ barcode?: string }>;
}) {
  const { barcode = "" } = await searchParams;
  const paintTypes = await getPaintTypes();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <Link
          href="/customers"
          className="text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          Back to customers
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground">
          Add a customer
        </h1>
        <p className="mt-1 text-sm text-muted">
          Register a new customer and, if you have their card, link it now.
        </p>
      </div>

      <div className={`${card} p-6`}>
        <CustomerForm paintTypes={paintTypes} initialBarcode={barcode} />
      </div>
    </div>
  );
}
