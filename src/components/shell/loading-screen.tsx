import Image from "next/image";

/**
 * The single, consistent loading screen used across the app. A red ring turns
 * around the static GP+ mark, like a wheel, so the brand stays legible while it
 * spins. Used for route loading and full-screen waits.
 */
export function LoadingScreen({
  label = "Loading",
  fullScreen = false,
}: {
  label?: string;
  fullScreen?: boolean;
}) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center gap-5",
        fullScreen ? "min-h-screen" : "min-h-[60vh] flex-1",
      ].join(" ")}
    >
      <div className="relative h-20 w-20">
        <div className="absolute inset-0 rounded-full border-4 border-brand-soft border-t-brand animate-spin-slow" />
        <div className="absolute inset-[0.6rem] flex items-center justify-center">
          <Image
            src="/gppluslogo-transparent.png"
            alt=""
            width={48}
            height={48}
            priority
            className="h-full w-full object-contain"
            aria-hidden
          />
        </div>
      </div>
      <p className="animate-fade-in text-sm font-medium text-muted">{label}</p>
    </div>
  );
}
