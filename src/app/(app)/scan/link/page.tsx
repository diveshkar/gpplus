import Link from "next/link";
import { redirect } from "next/navigation";
import { searchCustomers } from "@/lib/customers/queries";
import { CustomerSearch } from "@/components/customers/customer-search";
import { LinkCardList } from "@/components/customers/link-card-list";

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
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <Link
          href={`/scan/unknown?barcode=${encodeURIComponent(barcode)}`}
          className="text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          Back
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground">
          Link a replacement card
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Find the customer whose card was replaced, then link the new card{" "}
          <span className="font-medium text-foreground">{barcode}</span> to them.
          Their old card stops working and their points stay the same.
        </p>
      </div>

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
