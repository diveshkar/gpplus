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
 * Search customers by name, phone number, or barcode. An empty query returns
 * the most recently added customers so the list is never blank.
 */
export async function searchCustomers(
  query: string,
): Promise<CustomerWithPaintType[]> {
  const supabase = await createClient();
  const term = sanitiseSearchTerm(query);

  let request = supabase
    .from("customers")
    .select(CUSTOMER_WITH_TYPE_SELECT)
    .order("created_at", { ascending: false })
    .limit(50);

  if (term.length > 0) {
    const filters = [
      `full_name.ilike.%${term}%`,
      `phone_number.ilike.%${term}%`,
      `barcode_id.ilike.%${term}%`,
    ];
    // If the term is a full date (YYYY-MM-DD), also match on date of birth.
    if (/^\d{4}-\d{2}-\d{2}$/.test(term)) {
      filters.push(`date_of_birth.eq.${term}`);
    }
    request = request.or(filters.join(","));
  }

  const { data, error } = await request;
  if (error) throw error;
  return (data ?? []) as unknown as CustomerWithPaintType[];
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

