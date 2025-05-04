import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"

/**
 * Creates a Supabase client for server components
 * This cannot be a singleton because it needs the cookies from each request
 * @returns Supabase client for server components
 */
export function getServerSupabaseClient() {
  return createServerComponentClient<Database>({ cookies })
}

/**
 * @deprecated Use getServerSupabaseClient() instead
 * Alias for backward compatibility
 */
export const createServerClient = getServerSupabaseClient

/**
 * Creates a Supabase client for route handlers
 * @param cookiesInstance - The cookies instance from the route handler
 * @returns Supabase client for route handlers
 */
export function getRouteHandlerSupabaseClient(cookiesInstance: any) {
  const { createRouteHandlerClient } = require("@supabase/auth-helpers-nextjs")
  return createRouteHandlerClient<Database>({ cookies: cookiesInstance })
}
