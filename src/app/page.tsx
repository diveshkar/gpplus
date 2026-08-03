export default function Home() {
  const supabaseConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return (
    <main className="flex flex-1 items-center justify-center bg-white px-6 py-16 text-neutral-900">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        {/* GP+ mark — a simple placeholder; the real animated logo arrives in Phase 7 */}
        <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-neutral-900">
          <span className="text-3xl font-semibold tracking-tight text-[#9b1c1c]">
            GP<span className="align-super text-lg">+</span>
          </span>
        </div>

        <h1 className="mt-8 text-2xl font-semibold tracking-tight">
          GP+ Loyalty
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Paint shop loyalty points — admin panel
        </p>

        <div className="mt-8 rounded-lg border border-neutral-200 bg-neutral-50 px-5 py-4 text-sm">
          <p className="font-medium text-neutral-700">
            Phase 0 · Foundation ready
          </p>
          <p className="mt-1 flex items-center justify-center gap-2 text-neutral-500">
            <span
              className={
                supabaseConfigured
                  ? "inline-block h-2 w-2 rounded-full bg-green-500"
                  : "inline-block h-2 w-2 rounded-full bg-amber-500"
              }
              aria-hidden
            />
            {supabaseConfigured
              ? "Supabase connection configured"
              : "Supabase not connected yet — add .env.local"}
          </p>
        </div>

        <p className="mt-8 text-xs text-neutral-400">
          Login and the customer panel arrive in Phase 1.
        </p>
      </div>
    </main>
  );
}
