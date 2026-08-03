"use client";

import Image from "next/image";
import { useActionState } from "react";
import { login, type LoginState } from "@/lib/auth/actions";

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
      <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/80 to-[#3a0709]/85" />
      <div className="pointer-events-none absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-brand/25 blur-3xl" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm animate-fade-up">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-xl">
            <Image
              src="/gppluslogo-transparent.png"
              alt="GP+"
              width={44}
              height={44}
              priority
              className="h-11 w-11 object-contain"
            />
          </div>
          <h1 className="mt-6 font-heading text-3xl font-semibold tracking-tight text-white">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Sign in to the GP+ loyalty desk.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl sm:p-7">
          <form action={formAction} className="flex flex-col gap-5" noValidate>
            <div className="flex flex-col gap-1.5">
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

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium text-white/80"
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
                className={fieldClass}
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
              className="mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition-all hover:bg-brand-strong active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:active:scale-100"
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
        </div>

        <p className="mt-6 text-center text-xs text-white/40">
          Paint shop loyalty desk. Authorised staff only.
        </p>
      </div>
    </main>
  );
}
