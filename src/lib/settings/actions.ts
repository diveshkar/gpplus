"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SettingsValues = {
  redemption_threshold: string;
  redemption_value: string;
};

export type SettingsState = {
  error: string | null;
  success: boolean;
  values: SettingsValues;
};

/**
 * Update the redemption threshold and value. Changing the value re-values every
 * customer's remaining points at their next redemption; completed redemptions
 * are frozen by their own snapshot, so they are unaffected.
 */
export async function updateSettings(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const values: SettingsValues = {
    redemption_threshold: String(
      formData.get("redemption_threshold") ?? "",
    ).trim(),
    redemption_value: String(formData.get("redemption_value") ?? "").trim(),
  };

  const threshold = Number(values.redemption_threshold);
  const value = Number(values.redemption_value);

  if (
    values.redemption_threshold === "" ||
    Number.isNaN(threshold) ||
    threshold < 0
  ) {
    return {
      error: "Please enter a threshold of zero or more.",
      success: false,
      values,
    };
  }
  if (values.redemption_value === "" || Number.isNaN(value) || value <= 0) {
    return {
      error: "Please enter a redemption value greater than zero.",
      success: false,
      values,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("configuration")
    .update({ redemption_threshold: threshold, redemption_value: value })
    .eq("id", 1);

  if (error) {
    return {
      error: "Could not save the settings. Please try again.",
      success: false,
      values,
    };
  }

  revalidatePath("/settings");
  return { error: null, success: true, values };
}

export type PaintTypeValues = {
  name: string;
  earning_percentage: string;
};

export type PaintTypeState = {
  error: string | null;
  success: boolean;
  values: PaintTypeValues;
};

/**
 * Rename a paint type or change its earning rate. Changing the rate only affects
 * new transactions, since every past earn row snapshotted the rate it used.
 * Renaming updates the label shown everywhere, including on past rows, which is
 * fine because the name is just a label and the points are unaffected.
 */
export async function updatePaintType(
  _prev: PaintTypeState,
  formData: FormData,
): Promise<PaintTypeState> {
  const id = String(formData.get("paint_type_id") ?? "");
  const values: PaintTypeValues = {
    name: String(formData.get("name") ?? "").trim(),
    earning_percentage: String(formData.get("earning_percentage") ?? "").trim(),
  };

  if (!id) {
    return { error: "Missing the paint type.", success: false, values };
  }
  if (!values.name) {
    return { error: "Please enter a name.", success: false, values };
  }
  const percentage = Number(values.earning_percentage);
  if (
    values.earning_percentage === "" ||
    Number.isNaN(percentage) ||
    percentage < 0
  ) {
    return {
      error: "Please enter a percentage of zero or more.",
      success: false,
      values,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("paint_types")
    .update({ name: values.name, earning_percentage: percentage })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return {
        error: "A paint type with that name already exists.",
        success: false,
        values,
      };
    }
    return {
      error: "Could not save the paint type. Please try again.",
      success: false,
      values,
    };
  }

  revalidatePath("/settings");
  return { error: null, success: true, values };
}
