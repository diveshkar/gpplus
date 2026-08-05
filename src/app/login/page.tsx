"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/lib/auth/actions";
import { PasswordInput } from "@/components/ui/password-input";

const initialState: LoginState = { error: null };

const fieldClass =
  "h-12 w-full rounded-xl border border-white/15 bg-white/95 px-4 text-sm text-neutral-900 placeholder:text-neutral-400 transition-[border-color,box-shadow] focus:border-brand focus:ring-4 focus:ring-brand/25 focus:outline-none";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <main className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden bg-black px-6 py-12">
      {/* Cinematic background */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        poster="/6fb82d6b282bf00dbb281b144bacaf69.webp"
        aria-hidden
      >
        <source
          src="/large-thumbnail20250218-1298974-1yoh4ah.mp4"
          type="video/mp4"
        />
      </video>

      {/* Overlays for contrast and a warm red wash */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/92 via-black/82 to-[#3a0709]/88" />
      <div className="pointer-events-none absolute -left-40 top-1/4 h-[28rem] w-[28rem] rounded-full bg-brand/25 blur-3xl" />

      {/* Content: brand lockup and form, side by side on desktop */}
      <div className="relative z-10 grid w-full max-w-5xl animate-fade-up items-center gap-12 lg:grid-cols-2 lg:gap-20">
        {/* Brand */}
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand/90">
            Loyalty System
          </p>
          <h1 className="mt-3 font-heading text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
            Welcome back
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/60">
            Sign in to the loyalty desk to register customers, log sales, and
            reward your regulars.
          </p>
        </div>

        {/* Form card */}
        <div className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] p-8 shadow-2xl backdrop-blur-xl sm:p-10">
          <div className="mb-7">
            <h2 className="font-heading text-xl font-semibold tracking-tight text-white">
              Sign in
            </h2>
            <p className="mt-1 text-sm text-white/50">
              Enter your admin details to continue.
            </p>
          </div>

          <form action={formAction} className="flex flex-col gap-5" noValidate>
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium text-white/80">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                placeholder="you@example.com"
                className={fieldClass}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-white/80"
              >
                Password
              </label>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="current-password"
                required
                placeholder="Your password"
                className={fieldClass}
                toggleClassName="text-neutral-400 hover:text-neutral-700"
              />
            </div>

            {state.error ? (
              <p
                role="alert"
                className="rounded-xl border border-red-400/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-200"
              >
                {state.error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={pending}
              className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition-all hover:bg-brand-strong active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:active:scale-100"
            >
              {pending ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p className="mt-7 text-center text-xs text-white/40">
            Authorised staff only.
          </p>
        </div>
      </div>
    </main>
  );
}
