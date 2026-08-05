"use client";

import { LottiePlayer } from "@/components/ui/lottie-player";

/**
 * The default, generic loading screen for common spots that carry no business
 * branding, such as the login flow and the super admin area. Plays the shared
 * loading animation from the public folder. Inside a business's app, use
 * LoadingScreen instead so their branding appears.
 */
export function DefaultLoadingScreen({
  fullScreen = false,
}: {
  fullScreen?: boolean;
}) {
  return (
    <div
      className={[
        "flex animate-fade-in flex-col items-center justify-center gap-4 bg-white",
        fullScreen ? "fixed inset-0 z-[100]" : "min-h-[60vh] w-full flex-1",
      ].join(" ")}
    >
      <LottiePlayer
        src="/deafultloadingscreen.json"
        className="h-52 w-52 sm:h-60 sm:w-60"
        ariaLabel="Loading"
      />
    </div>
  );
}
