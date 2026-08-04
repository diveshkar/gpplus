"use client";

import { useLogo } from "@/components/shell/logo-context";

/**
 * The single, consistent loading screen. A red arc turns around the current
 * brand logo (the uploaded one when available, otherwise the default GP+ mark)
 * over a soft glow, with the logo as the focal point. In full-screen mode it
 * covers the entire viewport. Responsive across desktop, tablet, and mobile.
 */
export function LoadingScreen({
  label = "Loading",
  fullScreen = false,
}: {
  label?: string;
  fullScreen?: boolean;
}) {
  const logo = useLogo();

  return (
    <div
      className={[
        "flex animate-fade-in flex-col items-center justify-center gap-7 bg-white",
        fullScreen ? "fixed inset-0 z-[100]" : "min-h-[60vh] w-full flex-1",
      ].join(" ")}
    >
      <div className="relative flex h-36 w-36 items-center justify-center">
        <div
          className="absolute inset-4 rounded-full bg-brand/10 blur-2xl"
          aria-hidden
        />
        <div
          className="absolute inset-0 rounded-full border-[3px] border-brand-soft"
          aria-hidden
        />
        <div
          className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-brand animate-spin-slow"
          aria-hidden
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo}
          alt=""
          className="h-[5.5rem] w-[5.5rem] object-contain"
          aria-hidden
        />
      </div>
      {label ? (
        <p className="text-sm font-medium text-muted">{label}</p>
      ) : null}
    </div>
  );
}
