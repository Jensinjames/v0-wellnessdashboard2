/**
 * Consolidated Supabase client utilities
 * Single source of truth for Supabase interactions
 */
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { CookieOptions } from "@supabase/ssr"
import type { Database } from "@/types/database"
import { createLogger } from "@/utils/logger"

const logger = createLogger("Supabase")

// Client-side singleton
let clientInstance: ReturnType<typeof createClientComponentClient<Database>> | null = null

/**
 * Get the Supabase client for client components
 */
export function getClient() {
  if (!clientInstance) {
    clientInstance = createClientComponentClient<Database>({
      options: {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      },
    })
  }
  return clientInstance
}

/**
 * Alias for getClient for backward compatibility
 */
export const getSupabaseClient = getClient

/**
 * Create a Supabase client for server components
 */
export function createServerSupabase() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // This can happen in middleware when the cookies are read-only
            logger.error("Error setting cookie:", error)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options })
          } catch (error) {
            // This can happen in middleware when the cookies are read-only
            logger.error("Error removing cookie:", error)
          }
        },
      },
    },
  )
}

/**
 * Create a Supabase admin client for server-side operations that require service role
 * IMPORTANT: This should ONLY be used in server-side code, never exposed to the client
 */
export function createAdminSupabase() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not defined")
  }

  return createServerClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    cookies: {
      get(name: string) {
        return cookies().get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        cookies().set({ name, value, ...options })
      },
      remove(name: string, options: CookieOptions) {
        cookies().set({ name, value: "", ...options })
      },
    },
  })
}

// Aliases for backward compatibility
export const createClient = createServerSupabase
export const createAdminClient = createAdminSupabase
