"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type UploadResult = { url: string | null; error: string | null };

/**
 * Upload a logo image (given as a data URL from the browser) into the public
 * "logos" storage bucket and return its public URL. Uses the service-role
 * client so no bucket write policy is needed; the bucket is public-read so the
 * returned URL loads everywhere (app and printed cards). The caller must be
 * signed in.
 */
export async function uploadLogo(dataUrl: string): Promise<UploadResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { url: null, error: "You are not signed in." };

  if (!dataUrl.startsWith("data:image")) {
    return { url: null, error: "That is not a valid image." };
  }

  const [meta, b64] = dataUrl.split(",");
  const isJpg = meta.includes("jpeg") || meta.includes("jpg");
  const contentType = isJpg ? "image/jpeg" : "image/png";
  const ext = isJpg ? "jpg" : "png";
  const bytes = Buffer.from(b64, "base64");

  const admin = createAdminClient();
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await admin.storage
    .from("logos")
    .upload(path, bytes, { contentType, upsert: false });

  if (error) {
    console.error("uploadLogo: failed", error);
    return {
      url: null,
      error: "Could not upload the logo. Please try again.",
    };
  }

  const { data } = admin.storage.from("logos").getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}
