"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { fileToResizedDataUrl } from "@/lib/image";
import { uploadLogo } from "@/lib/storage/actions";
import { btnSecondary, label } from "@/lib/ui";

const DEFAULT_LOGO = "/loyalty-mark.svg";

/**
 * Logo picker that uploads to the "logos" storage bucket and keeps the public
 * URL in a hidden input (so the surrounding form just saves a URL). Used in
 * business Settings and in the super admin edit-organization form.
 */
export function LogoUpload({
  name,
  initialUrl,
  helpText,
}: {
  name: string;
  initialUrl: string;
  helpText?: string;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    startTransition(async () => {
      try {
        const dataUrl = await fileToResizedDataUrl(file, 512);
        const result = await uploadLogo(dataUrl);
        if (result.error || !result.url) {
          toast.error(result.error ?? "Upload failed");
          return;
        }
        setUrl(result.url);
        toast.success("Logo uploaded");
      } catch {
        toast.error("Could not process that image");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <span className={label}>Logo</span>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-border bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url || DEFAULT_LOGO}
            alt="Logo preview"
            className="h-12 w-12 object-contain"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={pending}
            className={`${btnSecondary} h-10`}
          >
            {pending ? "Uploading..." : "Upload logo"}
          </button>
          {url ? (
            <button
              type="button"
              onClick={() => setUrl("")}
              className="inline-flex h-10 items-center rounded-xl px-3 text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              Reset to default
            </button>
          ) : null}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) handleFile(file);
            event.target.value = "";
          }}
        />
      </div>
      {helpText ? <p className="text-xs text-muted">{helpText}</p> : null}
      <input type="hidden" name={name} value={url} />
    </div>
  );
}
