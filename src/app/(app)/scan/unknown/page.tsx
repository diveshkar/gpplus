import Link from "next/link";
import { redirect } from "next/navigation";
import { card } from "@/lib/ui";

/**
 * Reached when a scanned card matches nobody. The admin decides whether this is
 * a brand new customer, or an existing customer whose card was replaced (lost
 * card), which needs the barcode moved onto their existing record.
 */
export default async function UnknownScanPage({
  searchParams,
}: {
  searchParams: Promise<{ barcode?: string }>;
}) {
  const { barcode = "" } = await searchParams;

  if (!barcode) {
    redirect("/customers");
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand-strong">
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
            <path
              d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2M3 12h18"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="mt-4 font-heading text-2xl font-semibold tracking-tight text-foreground">
          This card is not linked yet
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          The card{" "}
          <span className="font-medium text-foreground">{barcode}</span> does not
          match any customer. What would you like to do?
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href={`/customers/new?barcode=${encodeURIComponent(barcode)}`}
          className={`${card} group flex flex-col gap-2 p-6 transition-colors hover:border-brand`}
        >
          <span className="text-sm font-semibold text-foreground">
            New customer
          </span>
          <span className="text-sm text-muted">
            Register someone new. The card is filled in for you on the next
            screen.
          </span>
        </Link>

        <Link
          href={`/scan/link?barcode=${encodeURIComponent(barcode)}`}
          className={`${card} group flex flex-col gap-2 p-6 transition-colors hover:border-brand`}
        >
          <span className="text-sm font-semibold text-foreground">
            Existing customer
          </span>
          <span className="text-sm text-muted">
            They lost their old card. Find their record and link this new card to
            it. Points and history stay the same.
          </span>
        </Link>
      </div>

      <div className="text-center">
        <Link
          href="/customers"
          className="text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
