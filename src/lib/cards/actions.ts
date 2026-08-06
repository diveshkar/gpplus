"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/profile";

// No ambiguous characters (no O/0, I/1), so the printed code is easy to read.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

function randomCode(): string {
  const bytes = new Uint32Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let s = "";
  for (let i = 0; i < CODE_LENGTH; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return s;
}

export type GenerateCardsState = {
  error: string | null;
  batchId: string | null;
  count: number;
};

/**
 * Generate a batch of unused cards for the current business. Codes are random
 * (so they are effectively unique everywhere) and de-duplicated against the
 * business's existing cards. The organization is stamped automatically.
 */
export async function generateCards(
  _prev: GenerateCardsState,
  formData: FormData,
): Promise<GenerateCardsState> {
  const count = Math.max(
    1,
    Math.min(2000, parseInt(String(formData.get("count") ?? ""), 10) || 0),
  );
  const prefix = String(formData.get("prefix") ?? "")
    .trim()
    .toUpperCase();

  const profile = await getProfile();
  if (!profile?.organization_id) {
    return { error: "You are not allowed to do this.", batchId: null, count: 0 };
  }

  const supabase = await createClient();

  // Avoid clashing with codes this business already has.
  const { data: existing } = await supabase.from("cards").select("code");
  const used = new Set((existing ?? []).map((row) => row.code as string));

  const batchId = crypto.randomUUID();
  const rows: { code: string; batch_id: string }[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (rows.length < count && guard < count * 40) {
    guard++;
    const code = prefix + randomCode();
    if (used.has(code) || seen.has(code)) continue;
    seen.add(code);
    rows.push({ code, batch_id: batchId });
  }

  const { error } = await supabase.from("cards").insert(rows);
  if (error) {
    console.error("generateCards: insert failed", error);
    return {
      error: "Could not generate the cards. Please try again.",
      batchId: null,
      count: 0,
    };
  }

  revalidatePath("/cards");
  return { error: null, batchId, count: rows.length };
}

export type CardDesignState = {
  error: string | null;
  success: boolean;
};

/**
 * Save the business's card design (title, tagline, and the optional back).
 * Branding (logo, colour, name) is set elsewhere and reused for the card.
 */
export async function updateCardDesign(
  _prev: CardDesignState,
  formData: FormData,
): Promise<CardDesignState> {
  const profile = await getProfile();
  if (!profile?.organization_id) {
    return { error: "You are not allowed to do this.", success: false };
  }

  const card_title = String(formData.get("card_title") ?? "").trim();
  const card_tagline = String(formData.get("card_tagline") ?? "").trim();
  const card_back_enabled = formData.get("card_back_enabled") === "on";
  const card_back_text = String(formData.get("card_back_text") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({
      card_title: card_title || null,
      card_tagline: card_tagline || null,
      card_back_enabled,
      card_back_text: card_back_text || null,
    })
    .eq("id", profile.organization_id);

  if (error) {
    return { error: "Could not save the card design. Please try again.", success: false };
  }

  revalidatePath("/cards");
  return { error: null, success: true };
}

/**
 * Report a customer's card as lost: mark it lost in the pool and unlink it from
 * the customer, so they can be given a replacement. Their points are untouched.
 */
export async function reportCardLost(customerId: string): Promise<void> {
  const profile = await getProfile();
  if (!profile?.organization_id) return;

  const supabase = await createClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("barcode_id")
    .eq("id", customerId)
    .maybeSingle();

  const barcode = customer?.barcode_id;
  if (barcode) {
    await supabase
      .from("cards")
      .update({ status: "lost" })
      .eq("code", barcode)
      .eq("status", "assigned");
  }

  await supabase
    .from("customers")
    .update({ barcode_id: null })
    .eq("id", customerId);

  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/cards");
}
