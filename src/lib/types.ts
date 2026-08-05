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

/**
 * A tenant. Each organization carries its own branding and loyalty settings
 * (its editable "template"), and every customer, transaction, and paint type
 * belongs to exactly one. Mirrors public.organizations (migration 0009).
 */
export type Organization = {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  admin_name: string | null;
  brand_color: string;
  redemption_threshold: number;
  redemption_value: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Role = "super_admin" | "org_admin";

/** Extends a Supabase Auth user with a role, their org, and personal details. */
export type Profile = {
  id: string;
  role: Role;
  organization_id: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

/** A customer row with its default paint type name embedded, for list/profile views. */
export type CustomerWithPaintType = Customer & {
  default_paint_type: Pick<PaintType, "name"> | null;
};
