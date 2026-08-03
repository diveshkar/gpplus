import { getConfiguration } from "@/lib/settings/queries";
import { SettingsForm } from "@/components/settings/settings-form";
import { card } from "@/lib/ui";

export default async function SettingsPage() {
  const config = await getConfiguration();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted">
          Control the redemption threshold and how much a point is worth.
        </p>
      </div>

      <div className={`${card} p-6`}>
        <SettingsForm
          initialThreshold={String(config.redemption_threshold)}
          initialValue={String(config.redemption_value)}
        />
      </div>
    </div>
  );
}
