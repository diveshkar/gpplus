import { getCurrentOrganization } from "@/lib/organizations/queries";
import { getPaintTypes } from "@/lib/customers/queries";
import { SettingsForm } from "@/components/settings/settings-form";
import { PaintTypesForm } from "@/components/settings/paint-types-form";
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
        description="Control redemption and the earning rates."
      />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* Redemption */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">Redemption</h2>
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

        {/* Paint types */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">Paint types</h2>
          <p className="text-sm text-muted">
            Rename a type or change its earning rate. A rate change only affects
            new transactions, since past ones keep the rate they were recorded
            with.
          </p>
          <div className={`${card} px-6 py-2`}>
            <PaintTypesForm paintTypes={paintTypes} />
          </div>
        </section>
      </div>
    </div>
  );
}
