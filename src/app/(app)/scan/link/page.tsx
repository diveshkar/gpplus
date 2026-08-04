import { redirect } from "next/navigation";
import { searchCustomers } from "@/lib/customers/queries";
import { CustomerSearch } from "@/components/customers/customer-search";
import { LinkCardList } from "@/components/customers/link-card-list";
import { PageHeader } from "@/components/ui/page-header";

/**
 * Lost-card path. Find the existing customer and move the new barcode onto
 * their record. The barcode is kept in the URL so it survives searching.
 */
export default async function LinkCardPage({
  searchParams,
}: {
  searchParams: Promise<{ barcode?: string; q?: string }>;
}) {
  const { barcode = "", q = "" } = await searchParams;

  if (!barcode) {
    redirect("/customers");
  }

  const candidates = await searchCustomers(q);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Link a replacement card"
        description={
          <>
            Find the customer whose card was replaced, then link the new card{" "}
            <span className="font-medium text-foreground">{barcode}</span> to
            them. Their old card stops working and their points stay the same.
          </>
        }
        backHref={`/scan/unknown?barcode=${encodeURIComponent(barcode)}`}
        backLabel="Back"
      />

      <CustomerSearch
        initialQuery={q}
        basePath="/scan/link"
        extraParams={{ barcode }}
        placeholder="Search by name, phone, or date of birth"
      />

      <LinkCardList candidates={candidates} barcode={barcode} />
    </div>
  );
}
