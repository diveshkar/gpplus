"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { findCustomerIdByBarcode } from "@/lib/customers/queries";

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
    return { error: "Please choose a customer type.", values };
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

  revalidatePath("/customers");
  redirect(`/customers/${data.id}`);
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

  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/customers");
  redirect(`/customers/${customerId}`);
}

/**
 * Scan lookup used by the global Scan button. A matching card opens the
 * customer directly; an unknown card leads to the new-or-existing decision.
 */
export async function scanLookup(formData: FormData): Promise<void> {
  const barcode = String(formData.get("barcode") ?? "").trim();

  if (!barcode) {
    redirect("/customers");
  }

  const customerId = await findCustomerIdByBarcode(barcode);

  if (customerId) {
    redirect(`/customers/${customerId}`);
  }

  redirect(`/scan/unknown?barcode=${encodeURIComponent(barcode)}`);
}
