import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getOrganizationById,
  getOrganizationCategories,
} from "@/lib/organizations/queries";
import { EditOrgForm } from "@/components/admin/edit-org-form";
import { OrgCategoriesForm } from "@/components/admin/org-categories-form";
import { ResetOrgPasswordForm } from "@/components/admin/reset-org-password-form";
import { card } from "@/lib/ui";

export default async function EditOrganizationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const org = await getOrganizationById(id);

  if (!org) {
    notFound();
  }

  const categories = await getOrganizationCategories(id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Link
          href="/admin"
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
            aria-hidden
          >
            <path
              d="m15 18-6-6 6-6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to organizations
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground">
          Edit {org.name}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Update this business&apos;s name, branding, and loyalty settings.
        </p>
      </div>

      <div className={`${card} p-6`}>
        <EditOrgForm org={org} />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">Categories</h2>
        <p className="text-sm text-muted">
          The kinds of products or services this business sells, and the points
          each earns. The business can also change these from their own settings.
        </p>
        <div className={`${card} px-6`}>
          <OrgCategoriesForm orgId={org.id} categories={categories} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">
          Reset admin password
        </h2>
        <p className="text-sm text-muted">
          If this business forgot their password, set a new temporary one here.
        </p>
        <div className={`${card} p-6`}>
          <ResetOrgPasswordForm orgId={org.id} />
        </div>
      </section>
    </div>
  );
}
