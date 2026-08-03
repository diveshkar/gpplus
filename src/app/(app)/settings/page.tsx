import { getConfiguration } from "@/lib/settings/queries";
import { getPaintTypes } from "@/lib/customers/queries";
import { SettingsForm } from "@/components/settings/settings-form";
import { PaintTypesForm } from "@/components/settings/paint-types-form";
import { card } from "@/lib/ui";

export default async function SettingsPage() {
  const [config, paintTypes] = await Promise.all([
    getConfiguration(),
    getPaintTypes(),
  ]);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted">
          Control redemption and the earning rates.
        </p>
      </div>

      {/* Redemption */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">Redemption</h2>
        <div className={`${card} p-6`}>
          <SettingsForm
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
  );
}
