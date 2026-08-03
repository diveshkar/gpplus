/**
 * Shared database entity types.
 *
 * These mirror the tables created in supabase/migrations/0001_init.sql. Numeric
 * columns come back from Supabase as JavaScript numbers.
 */

export type PaintType = {
  id: string;
  name: string;
  earning_percentage: number;
  created_at: string;
  updated_at: string;
};

export type Customer = {
  id: string;
  full_name: string;
  address: string | null;
  date_of_birth: string | null;
  phone_number: string | null;
  default_paint_type_id: string | null;
  barcode_id: string | null;
  points_balance: number;
  created_at: string;
  updated_at: string;
};

export type EntryType = "earn" | "redeem";

export type Transaction = {
  id: string;
  customer_id: string;
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
  updated_at: string;
};

export type Configuration = {
  id: number;
  redemption_threshold: number;
  redemption_value: number;
  updated_at: string;
};

/** A customer row with its default paint type name embedded, for list/profile views. */
export type CustomerWithPaintType = Customer & {
  default_paint_type: Pick<PaintType, "name"> | null;
};
