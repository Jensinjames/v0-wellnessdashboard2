/**
 * Server-side Supabase client utilities
 */
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { CookieOptions } from "@supabase/ssr"
import type { Database } from "@/types/database"
import { SERVER_ENV, validateServerEnv } from "@/lib/env-config"
import { createLogger } from "@/utils/logger"

const logger = createLogger("SupabaseServer")

/**
 * Create a Supabase client for server components
 */
export function createClient() {
  // Validate environment variables
  const { valid, missing } = validateServerEnv()
  if (!valid) {
    logger.error(`Missing Supabase environment variables: ${missing.join(", ")}`)
    throw new Error(`Missing required Supabase environment variables: ${missing.join(", ")}`)
  }

  const cookieStore = cookies()

  return createServerClient<Database>(SERVER_ENV.SUPABASE_URL!, SERVER_ENV.SUPABASE_ANON_KEY!, {
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
  })
}

/**
 * Create a Supabase admin client for server-side operations that require service role
 * IMPORTANT: This should ONLY be used in server-side code, never exposed to the client
 */
export function createAdminClient() {
  // Validate environment variables
  const { valid, missing } = validateServerEnv()
  if (!valid) {
    logger.error(`Missing Supabase environment variables: ${missing.join(", ")}`)
    throw new Error(`Missing required Supabase environment variables: ${missing.join(", ")}`)
  }

  if (!SERVER_ENV.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not defined")
  }

  return createServerClient<Database>(SERVER_ENV.SUPABASE_URL!, SERVER_ENV.SUPABASE_SERVICE_ROLE_KEY, {
    cookies: {
      get(name: string) {
        return cookies().get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookies().set({ name, value, ...options })
        } catch (error) {
          logger.error("Error setting cookie:", error)
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookies().set({ name, value: "", ...options })
        } catch (error) {
          logger.error("Error removing cookie:", error)
        }
      },
    },
  })
}
