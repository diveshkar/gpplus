"use client";

/**
 * A small, honest password strength meter. Scores length and character variety
 * and shows a four step bar with a label. Purely a visual guide; the real
 * minimum is enforced on submit.
 */
function score(password: string): number {
  if (!password) return 0;
  let points = 0;
  if (password.length >= 8) points += 1;
  if (password.length >= 12) points += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points += 1;
  if (/\d/.test(password)) points += 1;
  if (/[^A-Za-z0-9]/.test(password)) points += 1;
  // Collapse to a 0 to 4 scale.
  return Math.min(4, points);
}

const LABELS = ["", "Weak", "Fair", "Good", "Strong"];
const COLORS = [
  "bg-border",
  "bg-danger",
  "bg-warning",
  "bg-brand",
  "bg-success",
];

export function PasswordStrength({ password }: { password: string }) {
  const value = score(password);

  return (
    <div className="flex flex-col gap-1.5" aria-hidden={!password}>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={[
              "h-1.5 flex-1 rounded-full transition-colors",
              value >= step ? COLORS[value] : "bg-border",
            ].join(" ")}
          />
        ))}
      </div>
      {password ? (
        <p className="text-xs text-muted">
          Password strength:{" "}
          <span className="font-medium text-foreground">{LABELS[value]}</span>
        </p>
      ) : null}
    </div>
  );
}
