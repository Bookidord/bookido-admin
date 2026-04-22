import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

const COOKIE_DOMAIN =
  process.env.NODE_ENV === "production" ? ".bookido.online" : undefined;

/** Server Component / Server Action client (reads + writes cookies). */
export async function createSsrClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, { ...options, domain: COOKIE_DOMAIN }),
            );
          } catch {
            // Server Components can't set cookies — middleware handles refresh
          }
        },
      },
    },
  );
}

/** Middleware helper — returns updated response with refreshed cookies. */
export function createSsrMiddlewareClient(
  request: NextRequest,
  response: NextResponse,
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) =>
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, { ...options, domain: COOKIE_DOMAIN }),
          ),
      },
    },
  );
}
