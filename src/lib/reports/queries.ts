import { createClient } from "@/lib/supabase/server";

export type MonthlySummary = { issued: number; redeemed: number };

export type TopCustomer = {
  customer_id: string;
  full_name: string;
  points_earned: number;
};

/**
 * The current year and month in Sri Lanka time, so the default view always
 * matches the shop's local calendar regardless of where the server runs.
 */
export function currentPeriod(): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date());

  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  return { year, month };
}

/**
 * Total outstanding points across all customers. Multiply by the current
 * redemption value to get the LKR worth of product owed.
 */
export async function getLiabilityPoints(): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("dashboard_liability");
  if (error) throw error;
  return Number(data ?? 0);
}

/**
 * Points issued and redeemed in the given year and month.
 */
export async function getMonthlySummary(
  year: number,
  month: number,
): Promise<MonthlySummary> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("monthly_summary", {
    p_year: year,
    p_month: month,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    issued: Number(row?.issued ?? 0),
    redeemed: Number(row?.redeemed ?? 0),
  };
}

/**
 * Top customers by points earned in the given year and month.
 */
export async function getTopCustomers(
  year: number,
  month: number,
  limit = 5,
): Promise<TopCustomer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("top_customers", {
    p_year: year,
    p_month: month,
    p_limit: limit,
  });
  if (error) throw error;
  return (data ?? []) as TopCustomer[];
}
