import { createClient } from "@supabase/supabase-js"
import { createServerClient as createServerClient$1 } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

// Environment variables validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

// Validate URL format
try {
  new URL(supabaseUrl)
} catch (error) {
  throw new Error(`Invalid Supabase URL: ${supabaseUrl}`)
}

// SINGLETON PATTERN: Create a single instance of the Supabase client for the browser
let browserClient: ReturnType<typeof createClient<Database>> | null = null

// Client-side Supabase client (browser)
export function createBrowserClient() {
  if (typeof window === "undefined") {
    // Return a dummy client for SSR that won't persist anything
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  }

  // Return the existing instance if it exists
  if (browserClient) return browserClient

  // Create a new instance if it doesn't exist
  browserClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "sb-auth-token",
      flowType: "pkce",
    },
  })

  return browserClient
}

// Server-side Supabase client (for Server Components)
export function createServerClient() {
  const cookieStore = cookies()

  return createServerClient$1<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        cookieStore.set(name, value, options)
      },
      remove(name: string, options: any) {
        cookieStore.set(name, "", { ...options, maxAge: 0 })
      },
    },
  })
}

// Server-side Supabase client (for Server Actions)
export function createActionClient() {
  return createServerClient()
}

// Server-side Supabase client (for Server Actions)
export function createActionSupabaseClient() {
  return createServerClient()
}
