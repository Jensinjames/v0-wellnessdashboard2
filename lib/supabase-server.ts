import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { CookieOptions } from "@supabase/ssr"
import type { Database } from "@/types/database"

// This is a helper function to create a server client in route handlers and server actions
export function createServerSupabaseClient() {
  const cookieStore = cookies()

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error("Supabase URL and anon key are required")
  }

  return createServerClient<Database>(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name: string, options: { path: string; domain?: string }) {
        cookieStore.set({ name, value: "", ...options, maxAge: 0 })
      },
    },
  })
}

// Helper for custom cookie handlers (used in middleware and route handlers)
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
