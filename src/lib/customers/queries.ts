import { createClient } from "@/lib/supabase/server";
import type { CustomerWithPaintType, PaintType } from "@/lib/types";

const CUSTOMER_WITH_TYPE_SELECT =
  "id, full_name, address, date_of_birth, phone_number, default_paint_type_id, barcode_id, points_balance, created_at, updated_at, default_paint_type:paint_types(name)";

/**
 * Paint types for the dropdowns, sorted by name. Includes the earning rate so
 * the earn form can show a live points preview.
 */
export async function getPaintTypes(): Promise<
  Pick<PaintType, "id" | "name" | "earning_percentage">[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("paint_types")
    .select("id, name, earning_percentage")
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * Remove characters that would break Supabase's comma-separated `or` filter.
 */
function sanitiseSearchTerm(term: string): string {
  return term.replace(/[,%()]/g, " ").trim();
}

/**
 * Build the `or` filter for a search term, matching name, phone, barcode, and
 * (when the term is a full date) date of birth. Returns null for an empty term.
 */
function searchOrFilter(query: string): string | null {
  const term = sanitiseSearchTerm(query);
  if (!term) return null;

  const filters = [
    `full_name.ilike.%${term}%`,
    `phone_number.ilike.%${term}%`,
    `barcode_id.ilike.%${term}%`,
  ];
  if (/^\d{4}-\d{2}-\d{2}$/.test(term)) {
    filters.push(`date_of_birth.eq.${term}`);
  }
  return filters.join(",");
}

/**
 * Search customers by name, phone number, or barcode. An empty query returns
 * the most recently added customers so the list is never blank. Used where a
 * simple capped list is enough (the lost-card lookup).
 */
export async function searchCustomers(
  query: string,
): Promise<CustomerWithPaintType[]> {
  const supabase = await createClient();

  let request = supabase
    .from("customers")
    .select(CUSTOMER_WITH_TYPE_SELECT)
    .order("created_at", { ascending: false })
    .limit(50);

  const orFilter = searchOrFilter(query);
  if (orFilter) request = request.or(orFilter);

  const { data, error } = await request;
  if (error) throw error;
  return (data ?? []) as unknown as CustomerWithPaintType[];
}

export type CustomerSort = "name" | "balance" | "created";
export type SortDir = "asc" | "desc";

const SORT_COLUMN: Record<CustomerSort, string> = {
  name: "full_name",
  balance: "points_balance",
  created: "created_at",
};

/**
 * Paginated, sortable customer search for the main list. Returns one page of
 * results and the total count so the pagination control knows how many pages
 * there are.
 */
export async function searchCustomersPaged(
  query: string,
  page: number,
  options: { pageSize?: number; sort?: CustomerSort; dir?: SortDir } = {},
): Promise<{ customers: CustomerWithPaintType[]; total: number }> {
  const { pageSize = 15, sort = "created", dir = "desc" } = options;
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let request = supabase
    .from("customers")
    .select(CUSTOMER_WITH_TYPE_SELECT, { count: "exact" })
    .order(SORT_COLUMN[sort], { ascending: dir === "asc" })
    .range(from, to);

  const orFilter = searchOrFilter(query);
  if (orFilter) request = request.or(orFilter);

  const { data, error, count } = await request;
  if (error) throw error;
  return {
    customers: (data ?? []) as unknown as CustomerWithPaintType[],
    total: count ?? 0,
  };
}

/**
 * A single customer with its default paint type name, or null if not found.
 */
export async function getCustomerById(
  id: string,
): Promise<CustomerWithPaintType | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select(CUSTOMER_WITH_TYPE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return (data as unknown as CustomerWithPaintType) ?? null;
}

