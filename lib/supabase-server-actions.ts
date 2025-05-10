/**
 * Supabase Server Actions - Server-side client specifically for server actions
 * This file should ONLY be imported in server components or server actions
 */

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { CookieOptions } from "@supabase/ssr"
import type { Database } from "@/types/database"
import { serverEnv, validateEnv } from "@/lib/env"

// This is a helper function to create a server client specifically for server actions
export async function createServerActionSupabaseClient(
  options: {
    retryOnError?: boolean
    timeout?: number
  } = {},
) {
  // Validate environment variables
  if (!validateEnv()) {
    throw new Error("Missing required environment variables for Supabase server client")
  }

  const cookieStore = cookies()

  return createServerClient<Database>(serverEnv.SUPABASE_URL!, serverEnv.SUPABASE_ANON_KEY!, {
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
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: "pkce",
    },
    global: {
      headers: {
        "x-application-name": "wellness-dashboard-server-action",
      },
    },
    db: {
      schema: "public",
    },
  })
}
