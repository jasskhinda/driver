// Compatibility shim: drop-in replacement for @supabase/auth-helpers-nextjs
// client helper, backed by the supported @supabase/ssr package so cookie
// formats stay consistent with the server/middleware clients (Next.js 15 safe).
//
// Singleton: reuse one browser client to avoid "Multiple GoTrueClient
// instances" warnings and shared-storage races.
import { createBrowserClient } from '@supabase/ssr';

let browserClient;

export function createClientComponentClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }
  return browserClient;
}
