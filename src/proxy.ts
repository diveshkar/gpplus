import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy (formerly "middleware", renamed in Next.js 16).
 *
 * Two jobs on every matched request:
 *  1. Refresh the Supabase auth session so tokens stay valid and cookies are
 *     kept in sync between the browser and the server.
 *  2. Send anyone who is not signed in to the login screen before a protected
 *     page renders.
 *
 * This is a first line of defence only. Per the Next.js docs, auth is also
 * verified inside the protected layout and will be verified inside every
 * data-changing Server Action, so a request can never slip past by avoiding
 * the proxy.
 */

// Paths that must stay reachable without being signed in.
const PUBLIC_PREFIXES = ["/login", "/api/keep-alive"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() revalidates the token with Supabase, so it also refreshes the
  // session. Do not add code between creating the client and this call.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  // Run on everything except static assets, images, and video. The login video
  // must load before sign-in, so media extensions are excluded here. Auth checks
  // for API routes happen inside the routes themselves.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|mp4|webm)$).*)",
  ],
};
