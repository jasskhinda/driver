// Compatibility shim: drop-in replacement for @supabase/auth-helpers-nextjs
// client helper, backed by the supported @supabase/ssr package so cookie
// formats stay consistent with the server/middleware clients (Next.js 15 safe).
import { createBrowserClient } from '@supabase/ssr';

export function createClientComponentClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
