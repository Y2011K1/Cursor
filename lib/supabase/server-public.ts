import { createServerClient } from '@supabase/ssr'

/**
 * Server-side Supabase client that does NOT use cookies.
 * Use only for public data (e.g. landing page) inside unstable_cache
 * where request context (cookies()) is not available.
 */
export function createPublicClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // no-op: public client never sets cookies
        },
      },
    }
  )
}
