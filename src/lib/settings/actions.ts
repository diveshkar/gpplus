"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/profile";

export type SettingsValues = {
  admin_name: string;
  logo_url: string;
  brand_color: string;
  redemption_threshold: string;
  redemption_value: string;
};

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

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
    admin_name: String(formData.get("admin_name") ?? "").trim(),
    logo_url: String(formData.get("logo_url") ?? ""),
    brand_color: String(formData.get("brand_color") ?? "#c1121f").trim(),
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
  if (!HEX_COLOR.test(values.brand_color)) {
    return {
      error: "Please choose a valid brand colour.",
      success: false,
      values,
    };
  }

  const profile = await getProfile();
  if (!profile?.organization_id) {
    return { error: "You are not allowed to do this.", success: false, values };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({
      admin_name: values.admin_name || null,
      logo_url: values.logo_url || null,
      brand_color: values.brand_color,
      redemption_threshold: threshold,
      redemption_value: value,
    })
    .eq("id", profile.organization_id);

  if (error) {
    return {
      error: "Could not save the settings. Please try again.",
      success: false,
      values,
    };
  }

  // Branding (logo, colour) shows across the whole shell, so refresh the layout.
  revalidatePath("/", "layout");
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
 * Rename a category or change its earning rate. Changing the rate only affects
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
    return { error: "Missing the category.", success: false, values };
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
        error: "A category with that name already exists.",
        success: false,
        values,
      };
    }
    return {
      error: "Could not save the category. Please try again.",
      success: false,
      values,
    };
  }

  revalidatePath("/settings");
  return { error: null, success: true, values };
}

/**
 * Add a new category. The organization it belongs to is stamped automatically
 * by a database trigger, so it always lands in the caller's own business.
 */
export async function createPaintType(
  _prev: PaintTypeState,
  formData: FormData,
): Promise<PaintTypeState> {
  const values: PaintTypeValues = {
    name: String(formData.get("name") ?? "").trim(),
    earning_percentage: String(formData.get("earning_percentage") ?? "").trim(),
  };

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
    .insert({ name: values.name, earning_percentage: percentage });

  if (error) {
    if (error.code === "23505") {
      return {
        error: "A category with that name already exists.",
        success: false,
        values,
      };
    }
    return {
      error: "Could not add the category. Please try again.",
      success: false,
      values,
    };
  }

  revalidatePath("/settings");
  return {
    error: null,
    success: true,
    values: { name: "", earning_percentage: "" },
  };
}

/**
 * Remove a category. Any customers or past transactions that referenced it keep
 * their history; their link to this category is simply cleared (the database
 * handles that automatically). Row Level Security limits this to the caller's
 * own business.
 */
export async function deletePaintType(id: string): Promise<void> {
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("paint_types").delete().eq("id", id);
  revalidatePath("/settings");
}
