"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Postgres unique_violation. Raised if a barcode is already linked elsewhere.
const UNIQUE_VIOLATION = "23505";

export type CustomerFormValues = {
  full_name: string;
  address: string;
  date_of_birth: string;
  phone_number: string;
  default_paint_type_id: string;
  barcode_id: string;
};

export type CustomerFormState = {
  error: string | null;
  values: CustomerFormValues;
};

function readCustomerForm(formData: FormData): CustomerFormValues {
  return {
    full_name: String(formData.get("full_name") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    date_of_birth: String(formData.get("date_of_birth") ?? "").trim(),
    phone_number: String(formData.get("phone_number") ?? "").trim(),
    default_paint_type_id: String(formData.get("default_paint_type_id") ?? ""),
    barcode_id: String(formData.get("barcode_id") ?? "").trim(),
  };
}

/**
 * Register a new customer. On success, redirect straight to their profile.
 * On failure, return a friendly message and keep what was already typed.
 */
export async function createCustomer(
  _prev: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const values = readCustomerForm(formData);

  if (!values.full_name) {
    return { error: "Please enter the customer's full name.", values };
  }
  if (!values.default_paint_type_id) {
    return { error: "Please choose a category.", values };
  }
  if (!values.barcode_id) {
    return { error: "Please scan the customer's loyalty card.", values };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .insert({
      full_name: values.full_name,
      address: values.address || null,
      date_of_birth: values.date_of_birth || null,
      phone_number: values.phone_number || null,
      default_paint_type_id: values.default_paint_type_id,
      barcode_id: values.barcode_id || null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return {
        error: "That card is already linked to another customer.",
        values,
      };
    }
    return { error: "Something went wrong saving this customer. Please try again.", values };
  }

  // If this card came from the printed pool, mark it assigned. Best-effort: a
  // manually typed code simply matches nothing here.
  if (values.barcode_id) {
    await supabase
      .from("cards")
      .update({
        status: "assigned",
        customer_id: data.id,
        assigned_at: new Date().toISOString(),
      })
      .eq("code", values.barcode_id)
      .eq("status", "unused");
  }

  revalidatePath("/customers");
  redirect(`/customers/${data.id}?toast=customer_saved`);
}

/**
 * Update an existing customer's details. The card (barcode) is not changed here;
 * that is handled by the lost-card and replacement flow.
 */
export async function updateCustomer(
  _prev: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const id = String(formData.get("customer_id") ?? "");
  const values = readCustomerForm(formData);

  if (!id) {
    return { error: "Missing the customer.", values };
  }
  if (!values.full_name) {
    return { error: "Please enter the customer's full name.", values };
  }
  if (!values.default_paint_type_id) {
    return { error: "Please choose a category.", values };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("customers")
    .update({
      full_name: values.full_name,
      address: values.address || null,
      date_of_birth: values.date_of_birth || null,
      phone_number: values.phone_number || null,
      default_paint_type_id: values.default_paint_type_id,
    })
    .eq("id", id);

  if (error) {
    return {
      error: "Something went wrong saving this customer. Please try again.",
      values,
    };
  }

  revalidatePath(`/customers/${id}`);
  revalidatePath("/customers");
  redirect(`/customers/${id}?toast=customer_saved`);
}

export type ReassignState = {
  error: string | null;
};

/**
 * Lost-card path. Move a scanned new barcode onto an existing customer,
 * overwriting and so discarding their old barcode. Their points and history
 * stay exactly as they were. Only the new card works afterwards.
 */
export async function reassignBarcode(
  _prev: ReassignState,
  formData: FormData,
): Promise<ReassignState> {
  const customerId = String(formData.get("customer_id") ?? "");
  const barcode = String(formData.get("barcode_id") ?? "").trim();

  if (!customerId || !barcode) {
    return { error: "Missing the customer or the new card. Please try again." };
  }

  const supabase = await createClient();

  // Remember the card being replaced, so we can mark it lost.
  const { data: existing } = await supabase
    .from("customers")
    .select("barcode_id")
    .eq("id", customerId)
    .maybeSingle();
  const oldBarcode = existing?.barcode_id ?? null;

  const { error } = await supabase
    .from("customers")
    .update({ barcode_id: barcode })
    .eq("id", customerId);

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { error: "That card is already linked to another customer." };
    }
    return { error: "Could not link the new card. Please try again." };
  }

  // If the replacement card is from the printed pool, mark it assigned.
  await supabase
    .from("cards")
    .update({
      status: "assigned",
      customer_id: customerId,
      assigned_at: new Date().toISOString(),
    })
    .eq("code", barcode)
    .eq("status", "unused");

  // Retire the old card in the pool, if it was one.
  if (oldBarcode && oldBarcode !== barcode) {
    await supabase
      .from("cards")
      .update({ status: "lost" })
      .eq("code", oldBarcode)
      .eq("status", "assigned");
  }

  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/customers");
  redirect(`/customers/${customerId}?toast=card_linked`);
}

