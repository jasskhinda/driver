// Compatibility shim: drop-in replacement for @supabase/auth-helpers-nextjs
// server + route-handler helpers, backed by @supabase/ssr so the session cookie
// format matches the browser/middleware clients (fixes logout under Next.js 15).
//
// The original helpers accepted { cookies } but we read cookies() from
// next/headers directly here, which also covers the no-arg call variant.
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function makeServerClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore; the middleware
            // refreshes the session.
          }
        },
      },
    }
  );
}

export function createServerComponentClient() {
  return makeServerClient();
}

export function createRouteHandlerClient() {
  return makeServerClient();
}
