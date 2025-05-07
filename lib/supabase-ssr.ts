import { createBrowserClient, createServerClient } from "@supabase/ssr"
import { type CookieOptions, cookies } from "next/headers"
import type { Database } from "@/types/database"

// Environment variables are validated at build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a singleton instance for the browser client
let browserClientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null

/**
 * Creates a Supabase client for use in the browser
 */
export function createClient() {
  if (browserClientInstance) return browserClientInstance

  browserClientInstance = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)

  return browserClientInstance
}

/**
 * Creates a Supabase client for use in server components
 */
export function createServerComponentClient(cookieStore: ReturnType<typeof cookies>) {
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // This can happen in middleware when the cookies are read-only
          // We can safely ignore this error
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options })
        } catch (error) {
          // This can happen in middleware when the cookies are read-only
          // We can safely ignore this error
        }
      },
    },
  })
}

/**
 * Creates a Supabase client for use in server actions
 */
export function createServerActionClient() {
  const cookieStore = cookies()
  return createServerComponentClient(cookieStore)
}
