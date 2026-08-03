"use client";

import Image from "next/image";
import { useActionState } from "react";
import { login, type LoginState } from "@/lib/auth/actions";

const initialState: LoginState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex flex-col items-center text-center">
          <Image
            src="/gppluslogo.png"
            alt="GP+"
            width={84}
            height={84}
            priority
            className="h-20 w-20 object-contain"
          />
          <h1 className="mt-5 font-heading text-2xl font-semibold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Sign in to the GP+ loyalty desk.
          </p>
        </div>

        {/* Card */}
        <div className="mt-8 rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-sm sm:p-7">
          <form action={formAction} className="flex flex-col gap-5" noValidate>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                placeholder="you@example.com"
                className="h-11 rounded-lg border border-border bg-background px-3.5 text-sm text-foreground placeholder:text-muted/70 transition-colors focus:border-brand"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="Your password"
                className="h-11 rounded-lg border border-border bg-background px-3.5 text-sm text-foreground placeholder:text-muted/70 transition-colors focus:border-brand"
              />
            </div>

            {state.error ? (
              <p
                role="alert"
                className="rounded-lg border border-danger/20 bg-danger/5 px-3.5 py-2.5 text-sm text-danger"
              >
                {state.error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={pending}
              className="mt-1 inline-flex h-11 items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-brand-contrast transition-colors hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-70"
            >
              {pending ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          Paint shop loyalty desk. Authorised staff only.
        </p>
      </div>
    </main>
  );
}
