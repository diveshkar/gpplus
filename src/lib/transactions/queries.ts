import { createClient } from "@/lib/supabase/server";
import type { EntryType } from "@/lib/types";

export type TransactionRow = {
  id: string;
  entry_type: EntryType;
  description: string | null;
  amount: number;
  points: number;
  paint_type_id: string | null;
  earning_percentage: number | null;
  redemption_value: number | null;
  voided: boolean;
  voided_at: string | null;
  created_at: string;
  paint_type: { name: string } | null;
};

const TRANSACTION_SELECT =
  "id, entry_type, description, amount, points, paint_type_id, earning_percentage, redemption_value, voided, voided_at, created_at, paint_type:paint_types(name)";

/**
 * A customer's full activity, newest first. Includes voided rows so the history
 * can show them as cancelled rather than hiding them.
 */
export async function getCustomerTransactions(
  customerId: string,
): Promise<TransactionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(TRANSACTION_SELECT)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as TransactionRow[];
}

/**
 * A single transaction, for the edit screen.
 */
export async function getTransactionById(
  id: string,
): Promise<
  | (TransactionRow & { customer_id: string })
  | null
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(`${TRANSACTION_SELECT}, customer_id`)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return (data as unknown as TransactionRow & { customer_id: string }) ?? null;
}

/**
 * The balance the rows say a customer should have: the sum of every non-voided
 * transaction's points. Used to check the stored balance has not drifted.
 */
export function expectedBalance(transactions: TransactionRow[]): number {
  return transactions
    .filter((t) => !t.voided)
    .reduce((total, t) => total + t.points, 0);
}
