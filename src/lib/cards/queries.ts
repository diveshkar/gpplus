import { createClient } from "@/lib/supabase/server";

export type CardStats = {
  total: number;
  unused: number;
  assigned: number;
  lost: number;
};

/** Inventory counts for the current business (scoped by RLS). */
export async function getCardStats(): Promise<CardStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("card_stats");
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    total: Number(row?.total ?? 0),
    unused: Number(row?.unused ?? 0),
    assigned: Number(row?.assigned ?? 0),
    lost: Number(row?.lost ?? 0),
  };
}

export type CardBatch = {
  batch_id: string;
  total: number;
  assigned: number;
  created_at: string;
};

/** Print runs, newest first. */
export async function getCardBatches(): Promise<CardBatch[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("card_batches");
  if (error) throw error;
  return (data ?? []).map(
    (row: {
      batch_id: string;
      total: number;
      assigned: number;
      created_at: string;
    }) => ({
      batch_id: row.batch_id,
      total: Number(row.total),
      assigned: Number(row.assigned),
      created_at: row.created_at,
    }),
  );
}
