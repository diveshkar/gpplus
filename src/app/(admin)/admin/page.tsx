import Link from "next/link";
import { listOrganizations } from "@/lib/organizations/queries";
import { OrgActiveToggle } from "@/components/admin/org-active-toggle";
import { OrgDeleteButton } from "@/components/admin/org-delete-button";
import { formatDate } from "@/lib/format";
import { btnPrimary, card } from "@/lib/ui";

export default async function AdminOrganizationsPage() {
  const organizations = await listOrganizations();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Organizations
          </h1>
          <p className="mt-1 text-sm text-muted">
            {organizations.length}{" "}
            {organizations.length === 1 ? "organization" : "organizations"} on
            the platform.
          </p>
        </div>
        <Link href="/admin/new" className={btnPrimary}>
          New organization
        </Link>
      </div>

      {organizations.length === 0 ? (
        <div className={`${card} px-6 py-12 text-center`}>
          <p className="text-base font-semibold text-foreground">
            No organizations yet
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            Create your first organization and its admin login to get started.
          </p>
          <Link href="/admin/new" className={`${btnPrimary} mt-4`}>
            New organization
          </Link>
        </div>
      ) : (
        <div className={`${card} divide-y divide-border overflow-hidden`}>
          {organizations.map((org) => (
            <div
              key={org.id}
              className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white"
                  style={{ backgroundColor: org.brand_color }}
                >
                  {org.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {org.name}
                  </p>
                  <p className="text-xs text-muted">
                    Added {formatDate(org.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={[
                    "rounded-full px-2.5 py-1 text-xs font-medium",
                    org.active
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-neutral-100 text-muted",
                  ].join(" ")}
                >
                  {org.active ? "Active" : "Suspended"}
                </span>
                <OrgActiveToggle id={org.id} active={org.active} />
                <OrgDeleteButton id={org.id} name={org.name} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
