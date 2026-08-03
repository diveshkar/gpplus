"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EarnFormValues = {
  paint_type_id: string;
  amount: string;
  description: string;
};

export type EarnFormState = {
  error: string | null;
  values: EarnFormValues;
};

function readEarnForm(formData: FormData): EarnFormValues {
  return {
    paint_type_id: String(formData.get("paint_type_id") ?? ""),
    amount: String(formData.get("amount") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
  };
}

function validateEarn(values: EarnFormValues): string | null {
  if (!values.paint_type_id) return "Please choose a paint type.";
  const amount = Number(values.amount);
  if (!values.amount || Number.isNaN(amount) || amount <= 0) {
    return "Please enter an amount greater than zero.";
  }
  return null;
}

/**
 * Record an earn transaction. The database function does the maths and the
 * balance update together, so they can never go out of sync.
 */
export async function createEarnTransaction(
  _prev: EarnFormState,
  formData: FormData,
): Promise<EarnFormState> {
  const customerId = String(formData.get("customer_id") ?? "");
  const values = readEarnForm(formData);

  const problem = validateEarn(values);
  if (problem) return { error: problem, values };
  if (!customerId) return { error: "Missing the customer.", values };

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_earn_transaction", {
    p_customer_id: customerId,
    p_paint_type_id: values.paint_type_id,
    p_amount: Number(values.amount),
    p_description: values.description,
  });

  if (error) {
    return { error: "Could not save this transaction. Please try again.", values };
  }

  revalidatePath(`/customers/${customerId}`);
  redirect(`/customers/${customerId}`);
}

/**
 * Edit an earn transaction and adjust the balance by the difference.
 */
export async function editEarnTransaction(
  _prev: EarnFormState,
  formData: FormData,
): Promise<EarnFormState> {
  const transactionId = String(formData.get("transaction_id") ?? "");
  const customerId = String(formData.get("customer_id") ?? "");
  const values = readEarnForm(formData);

  const problem = validateEarn(values);
  if (problem) return { error: problem, values };
  if (!transactionId || !customerId) {
    return { error: "Missing the transaction. Please try again.", values };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("edit_earn_transaction", {
    p_transaction_id: transactionId,
    p_paint_type_id: values.paint_type_id,
    p_amount: Number(values.amount),
    p_description: values.description,
  });

  if (error) {
    return { error: "Could not update this transaction. Please try again.", values };
  }

  revalidatePath(`/customers/${customerId}`);
  redirect(`/customers/${customerId}`);
}

/**
 * Void (cancel) a transaction and reverse its effect on the balance. The row
 * stays in the record for audit.
 */
export async function voidTransaction(formData: FormData): Promise<void> {
  const transactionId = String(formData.get("transaction_id") ?? "");
  const customerId = String(formData.get("customer_id") ?? "");

  if (!transactionId || !customerId) return;

  const supabase = await createClient();
  await supabase.rpc("void_transaction", {
    p_transaction_id: transactionId,
  });

  revalidatePath(`/customers/${customerId}`);
}

export type ScannedCustomer = {
  id: string;
  full_name: string;
  points_balance: number;
  default_paint_type_id: string | null;
};

export type ScanLookupResult =
  | { status: "empty" }
  | { status: "found"; customer: ScannedCustomer }
  | { status: "unknown"; barcode: string };

/**
 * Scan lookup used by the global Scan popup. Unlike a redirect, this returns the
 * customer to the client so the popup can open the quick Earn form in place. An
 * unknown card is reported back so the popup can route to the new-or-existing
 * decision.
 */
export async function scanBarcode(barcode: string): Promise<ScanLookupResult> {
  const value = barcode.trim();
  if (!value) return { status: "empty" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id, full_name, points_balance, default_paint_type_id")
    .eq("barcode_id", value)
    .maybeSingle();

  if (error || !data) {
    return { status: "unknown", barcode: value };
  }

  return { status: "found", customer: data };
}
