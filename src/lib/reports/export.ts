import { createClient } from "@/lib/supabase/server";

// Sri Lanka is a fixed UTC+5:30 with no daylight saving, so a month's
// boundaries in Colombo time convert to fixed UTC instants.
const COLOMBO_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function colomboMonthRangeUtc(year: number, month: number): {
  startIso: string;
  endIso: string;
} {
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;

  const startUtcMs = Date.UTC(year, month - 1, 1) - COLOMBO_OFFSET_MS;
  const endUtcMs = Date.UTC(nextYear, nextMonth - 1, 1) - COLOMBO_OFFSET_MS;

  return {
    startIso: new Date(startUtcMs).toISOString(),
    endIso: new Date(endUtcMs).toISOString(),
  };
}

export type ExportTransaction = {
  created_at: string;
  entry_type: "earn" | "redeem";
  description: string | null;
  amount: number;
  points: number;
  earning_percentage: number | null;
  redemption_value: number | null;
  voided: boolean;
  customer: { full_name: string } | null;
  paint_type: { name: string } | null;
};

export type ExportCustomer = {
  full_name: string;
  phone_number: string | null;
  date_of_birth: string | null;
  address: string | null;
  barcode_id: string | null;
  points_balance: number;
  created_at: string;
  default_paint_type: { name: string } | null;
};

export type ExportData = {
  transactions: ExportTransaction[];
  customers: ExportCustomer[];
  paintTypes: { name: string; earning_percentage: number }[];
  config: { redemption_threshold: number; redemption_value: number };
};

/**
 * Gather everything the export needs. Transactions are limited to the selected
 * month (in Sri Lanka time); customers, paint types, and settings are full
 * snapshots so the file works as a complete backup.
 */
export async function getExportData(
  year: number,
  month: number,
): Promise<ExportData> {
  const supabase = await createClient();
  const { startIso, endIso } = colomboMonthRangeUtc(year, month);

  const [txResult, customersResult, paintTypesResult, configResult] =
    await Promise.all([
      supabase
        .from("transactions")
        .select(
          "created_at, entry_type, description, amount, points, earning_percentage, redemption_value, voided, customer:customers(full_name), paint_type:paint_types(name)",
        )
        .gte("created_at", startIso)
        .lt("created_at", endIso)
        .order("created_at", { ascending: true }),
      supabase
        .from("customers")
        .select(
          "full_name, phone_number, date_of_birth, address, barcode_id, points_balance, created_at, default_paint_type:paint_types(name)",
        )
        .order("full_name", { ascending: true }),
      supabase
        .from("paint_types")
        .select("name, earning_percentage")
        .order("name", { ascending: true }),
      supabase
        .from("configuration")
        .select("redemption_threshold, redemption_value")
        .eq("id", 1)
        .single(),
    ]);

  if (txResult.error) throw txResult.error;
  if (customersResult.error) throw customersResult.error;
  if (paintTypesResult.error) throw paintTypesResult.error;
  if (configResult.error) throw configResult.error;

  return {
    transactions: (txResult.data ?? []) as unknown as ExportTransaction[],
    customers: (customersResult.data ?? []) as unknown as ExportCustomer[],
    paintTypes: paintTypesResult.data ?? [],
    config: configResult.data as {
      redemption_threshold: number;
      redemption_value: number;
    },
  };
}
