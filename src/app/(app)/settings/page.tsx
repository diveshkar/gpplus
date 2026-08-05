import { getCurrentOrganization } from "@/lib/organizations/queries";
import { getPaintTypes } from "@/lib/customers/queries";
import { SettingsForm } from "@/components/settings/settings-form";
import { CategoriesForm } from "@/components/settings/categories-form";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { PageHeader } from "@/components/ui/page-header";
import { card } from "@/lib/ui";

export default async function SettingsPage() {
  const [config, paintTypes] = await Promise.all([
    getCurrentOrganization(),
    getPaintTypes(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Control your branding, redemption, and categories."
      />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* Business */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">
            Business settings
          </h2>
          <div className={`${card} p-6`}>
            <SettingsForm
              initialName={config.admin_name ?? ""}
              initialLogo={config.logo_url ?? ""}
              initialBrandColor={config.brand_color}
              initialThreshold={String(config.redemption_threshold)}
              initialValue={String(config.redemption_value)}
            />
          </div>
        </section>

        {/* Categories and password fill the second column */}
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-foreground">Categories</h2>
            <p className="text-sm text-muted">
              Set the kinds of products or services you sell and how many points
              each earns. A rate change only affects new sales, since past ones
              keep the rate they were recorded with.
            </p>
            <div className={`${card} px-6 py-2`}>
              <CategoriesForm categories={paintTypes} />
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-foreground">Password</h2>
            <p className="text-sm text-muted">
              Change the password you use to sign in. Pick something only you
              know.
            </p>
            <div className={`${card} p-6`}>
              <ChangePasswordForm />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
