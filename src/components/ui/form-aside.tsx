import { LottiePlayer } from "@/components/ui/lottie-player";

/**
 * The companion panel shown beside a form on wide screens.
 *
 * Form pages are narrow by nature, which leaves a lot of empty space on desktop.
 * This fills it with purpose: a relevant animation plus a short, reassuring note
 * and a few contextual tips, so the space works for the user instead of sitting
 * blank. It is hidden below `lg` where the single-column form already fills the
 * viewport, so mobile stays clean and free of large empty gaps.
 */
export function FormAside({
  animation,
  title,
  intro,
  tips,
}: {
  /** Path to a Lottie JSON in /public. */
  animation: string;
  title: string;
  intro: string;
  tips?: string[];
}) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-8 flex h-full flex-col justify-center overflow-hidden rounded-[var(--radius-lg)] border border-border bg-gradient-to-b from-brand-soft/70 via-surface to-surface p-8 shadow-card">
        <LottiePlayer
          src={animation}
          className="mx-auto h-72 w-full max-w-sm"
          ariaLabel={title}
        />
        <h2 className="mt-2 text-center font-heading text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="mx-auto mt-1.5 max-w-sm text-center text-sm text-muted">
          {intro}
        </p>

        {tips && tips.length > 0 ? (
          <ul className="mx-auto mt-6 flex max-w-sm flex-col gap-2.5 border-t border-border pt-6">
            {tips.map((tip) => (
              <li key={tip} className="flex items-start gap-2.5 text-sm text-muted">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="mt-0.5 h-4 w-4 shrink-0 text-brand"
                  aria-hidden
                >
                  <path
                    d="m5 13 4 4L19 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </aside>
  );
}
