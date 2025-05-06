import { createServerClient } from "@supabase/ssr"
import type { Database } from "@/types/database"
import type { CookieOptions } from "@supabase/ssr"

// This is a helper function to create a server client in route handlers and server actions
// It doesn't use next/headers directly, so it can be imported anywhere
export function createClient(
  cookieGetter: (name: string) => string | undefined,
  cookieSetter: (name: string, value: string, options: CookieOptions) => void,
) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error("Supabase URL and anon key are required")
  }

  return createServerClient<Database>(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieGetter(name)
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieSetter(name, value, options)
      },
      remove(name: string, options: { path: string; domain?: string }) {
        cookieSetter(name, "", { ...options, maxAge: 0 })
      },
    },
  })
}
