"use client";

import { useEffect, useRef } from "react";
import type { AnimationItem } from "lottie-web";

/**
 * Renders a Lottie JSON animation from the /public folder.
 *
 * lottie-web touches the DOM, so it is loaded lazily on the client (inside an
 * effect) to keep it out of the server bundle and off the initial render. The
 * JSON is fetched by lottie itself via the `path` option, so the (large)
 * animation data never bloats the page's JavaScript bundle.
 *
 * Motion is a courtesy, never a requirement: when the visitor prefers reduced
 * motion we render the first frame and hold, so nothing moves.
 */
export function LottiePlayer({
  src,
  className,
  loop = true,
  autoplay = true,
  speed = 1,
  ariaLabel,
}: {
  /** Path to the Lottie JSON, e.g. "/painting-and-decorating.json". */
  src: string;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
  speed?: number;
  /** When provided the animation is exposed as an image to assistive tech. */
  ariaLabel?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animation: AnimationItem | undefined;
    let cancelled = false;

    (async () => {
      // Fetch the JSON ourselves and pass the parsed data to lottie. Letting
      // lottie load the path itself can trip an XHR responseType bug in some
      // browsers ("Failed to read the 'responseText' property..."), so we avoid
      // its internal request entirely.
      const [lottieModule, data] = await Promise.all([
        import("lottie-web"),
        fetch(src)
          .then((response) => (response.ok ? response.json() : null))
          .catch(() => null),
      ]);
      if (cancelled || !containerRef.current || !data) return;

      const lottie = lottieModule.default;
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      animation = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop,
        autoplay: autoplay && !prefersReducedMotion,
        animationData: data,
      });

      animation.setSpeed(speed);

      // Hold on the first frame for reduced-motion users so the illustration
      // still shows without any movement.
      if (prefersReducedMotion) {
        animation.goToAndStop(0, true);
      }
    })();

    return () => {
      cancelled = true;
      animation?.destroy();
    };
  }, [src, loop, autoplay, speed]);

  return (
    <div
      ref={containerRef}
      className={className}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
    />
  );
}
