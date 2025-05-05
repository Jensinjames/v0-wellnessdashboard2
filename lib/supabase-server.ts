import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"

/**
 * Creates a Supabase client for server components
 * This cannot be a singleton because it needs the cookies from each request
 * @returns Supabase client for server components
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options) {
          // This will never be called in a server component
          // but is needed for the interface
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Cannot modify cookies in a server component after they've been sent
          }
        },
        remove(name: string, options) {
          // This will never be called in a server component
          // but is needed for the interface
          try {
            cookieStore.set({ name, value: "", ...options })
          } catch (error) {
            // Cannot modify cookies in a server component after they've been sent
          }
        },
      },
    },
  )
}

/**
 * @deprecated Use createSupabaseServerClient() instead
 * Alias for backward compatibility
 */
export const createClient = createSupabaseServerClient

/**
 * Creates a Supabase client for route handlers
 * @param cookiesInstance - The cookies instance from the route handler
 * @returns Supabase client for route handlers
 */
export function getRouteHandlerSupabaseClient(cookiesInstance: any) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookiesInstance.get(name)?.value
        },
        set(name: string, value: string, options) {
          cookiesInstance.set({ name, value, ...options })
        },
        remove(name: string, options) {
          cookiesInstance.set({ name, value: "", ...options })
        },
      },
    },
  )
}

/**
 * Alias for createSupabaseServerClient for backward compatibility
 * @deprecated Use createSupabaseServerClient() instead
 */
export const createServerComponentClient = createSupabaseServerClient
