"use client";

import { Toaster as SonnerToaster } from "sonner";

/**
 * App-wide toast host. Toasts auto-dismiss after a few seconds, pause on hover
 * (Sonner default), and come in success, error, warning, and info variants with
 * clear colours and a close button. Rendered once in the root layout.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      richColors
      closeButton
      duration={4000}
      toastOptions={{ className: "font-sans rounded-xl" }}
    />
  );
}
