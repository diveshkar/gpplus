import Link from "next/link";
import { CreateOrgForm } from "@/components/admin/create-org-form";
import { card } from "@/lib/ui";

export default function NewOrganizationPage() {
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
          New organization
        </h1>
        <p className="mt-1 text-sm text-muted">
          Set up a shop and its admin login. It starts from the default template
          and the admin can customise everything afterwards.
        </p>
      </div>

      <div className={`${card} p-6`}>
        <CreateOrgForm />
      </div>
    </div>
  );
}
