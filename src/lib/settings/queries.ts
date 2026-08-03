import { createClient } from "@/lib/supabase/server";
import type { Configuration } from "@/lib/types";

/**
 * The single system settings row: redemption threshold and redemption value.
 */
export async function getConfiguration(): Promise<Configuration> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("configuration")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) throw error;
  return data as Configuration;
}
