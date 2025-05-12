import { createServerClient as createServerClient$1 } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

// Environment variables validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
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
