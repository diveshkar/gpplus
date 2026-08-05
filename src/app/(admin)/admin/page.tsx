import { Suspense } from "react";
import Link from "next/link";
import { listOrganizationsWithStats } from "@/lib/organizations/queries";
import { OrgTable } from "@/components/admin/org-table";
import { TableSkeleton } from "@/components/ui/table";
import { btnPrimary } from "@/lib/ui";

async function OrgResults() {
  const organizations = await listOrganizationsWithStats();
  return <OrgTable organizations={organizations} />;
}

export default function AdminOrganizationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Organizations
          </h1>
          <p className="mt-1 text-sm text-muted">
            Manage every business on the platform.
          </p>
        </div>
        <Link href="/admin/new" className={btnPrimary}>
          New organization
        </Link>
      </div>

      <Suspense fallback={<TableSkeleton columns={6} rows={6} />}>
        <OrgResults />
      </Suspense>
    </div>
  );
}
