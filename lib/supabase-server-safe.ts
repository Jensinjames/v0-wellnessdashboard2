import { createServerClient } from "@supabase/ssr"
import type { Database } from "@/types/database"
import { getSupabaseCredentials } from "@/lib/env"
import type { NextRequest, NextResponse } from "next/server"

// Create a Supabase client for middleware
export function createMiddlewareSupabaseClient(req: NextRequest, res: NextResponse) {
  // Get Supabase credentials
  const { supabaseUrl, supabaseKey } = getSupabaseCredentials()

  // Validate environment variables
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase credentials")
  }

  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value
      },
      set(name: string, value: string, options) {
        res.cookies.set({
          name,
          value,
          ...options,
        })
      },
      remove(name: string, options) {
        res.cookies.set({
          name,
          value: "",
          ...options,
          maxAge: 0,
        })
      },
    },
  })
}

// Create a Supabase client for server components
// This version doesn't use next/headers directly
export function createSafeServerSupabaseClient(
  cookieGetter: (name: string) => string | undefined,
  cookieSetter: (name: string, value: string, options: any) => void,
) {
  // Get Supabase credentials
  const { supabaseUrl, supabaseKey } = getSupabaseCredentials()

  // Validate environment variables
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase credentials")
  }

  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return cookieGetter(name)
      },
      set(name: string, value: string, options) {
        cookieSetter(name, value, options)
      },
      remove(name: string, options) {
        cookieSetter(name, "", { ...options, maxAge: 0 })
      },
    },
  })
}
