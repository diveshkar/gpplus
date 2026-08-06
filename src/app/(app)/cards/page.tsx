import { getCardStats, getCardBatches } from "@/lib/cards/queries";
import { getCurrentOrganization } from "@/lib/organizations/queries";
import { GenerateCards } from "@/components/cards/generate-cards";
import { CardDesignForm } from "@/components/cards/card-design-form";
import { PageHeader } from "@/components/ui/page-header";
import { formatDate } from "@/lib/format";
import { card } from "@/lib/ui";

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className={`${card} p-5`}>
      <p className="text-sm text-muted">{label}</p>
      <p
        className={[
          "mt-1 font-heading text-2xl font-semibold tracking-tight tabular-nums",
          accent ? "text-brand" : "text-foreground",
        ].join(" ")}
      >
        {value.toLocaleString()}
      </p>
    </div>
  );
}

export default async function CardsPage() {
  const [stats, batches, org] = await Promise.all([
    getCardStats(),
    getCardBatches(),
    getCurrentOrganization(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Cards"
        description="Generate printable loyalty cards and track them."
      />

      {/* Inventory */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Total printed" value={stats.total} />
        <StatTile label="Assigned" value={stats.assigned} accent />
        <StatTile label="Unused" value={stats.unused} />
        <StatTile label="Lost" value={stats.lost} />
      </div>

      {/* Card design */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">Card design</h2>
        <div className={`${card} p-6`}>
          <CardDesignForm
            title={org.card_title ?? ""}
            tagline={org.card_tagline ?? ""}
            backEnabled={org.card_back_enabled}
            backText={org.card_back_text ?? ""}
          />
        </div>
      </section>

      {/* Generate */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">
          Generate a batch
        </h2>
        <div className={`${card} p-6`}>
          <GenerateCards />
        </div>
      </section>

      {/* Print runs */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">Print runs</h2>
        {batches.length === 0 ? (
          <div className={`${card} px-6 py-10 text-center`}>
            <p className="text-sm font-medium text-foreground">No cards yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
              Generate your first batch above, then download the PDF and send it
              to a print shop.
            </p>
          </div>
        ) : (
          <div className={`${card} divide-y divide-border overflow-hidden`}>
            {batches.map((batch) => (
              <div
                key={batch.batch_id}
                className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {batch.total} cards
                  </p>
                  <p className="text-xs text-muted">
                    {formatDate(batch.created_at)} · {batch.assigned} assigned ·{" "}
                    {batch.total - batch.assigned} unused
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/api/cards/${batch.batch_id}`}
                    className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm font-medium text-muted transition-colors hover:border-brand hover:text-brand"
                  >
                    PDF
                  </a>
                  <a
                    href={`/api/cards/${batch.batch_id}?format=xlsx`}
                    className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm font-medium text-muted transition-colors hover:border-brand hover:text-brand"
                  >
                    Excel
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
