/**
 * Supabase Server Compatibility Layer
 * This file provides utilities for creating Supabase clients in both Pages Router and App Router
 */

import { createServerClient } from "@supabase/ssr"
import type { CookieOptions } from "@supabase/ssr"
import type { Database } from "@/types/database"
import { getSupabaseCredentials } from "@/lib/env"
import type { NextApiRequest, NextApiResponse } from "next"

// Detect if we're in the App Router or Pages Router
const isAppRouter = process.env.NEXT_RUNTIME === "nodejs"

// Create a Supabase client for use in both App Router and Pages Router
export function createCompatibleSupabaseClient(
  reqOrCookieGetter: NextApiRequest | ((name: string) => string | undefined),
  resOrCookieSetter: NextApiResponse | ((name: string, value: string, options: CookieOptions) => void),
  options: {
    retryOnError?: boolean
    timeout?: number
  } = {},
) {
  // Get Supabase credentials
  const { supabaseUrl, supabaseKey } = getSupabaseCredentials()

  // Validate environment variables
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials:", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
    })
    throw new Error(
      "Your project's URL and Key are required to create a Supabase client!\n\n" +
        "Check your Supabase project's API settings to find these values\n\n" +
        "https://supabase.com/dashboard/project/_/settings/api",
    )
  }

  // Create cookie handlers based on whether we're in the App Router or Pages Router
  let cookieHandlers: {
    get: (name: string) => string | undefined
    set: (name: string, value: string, options: CookieOptions) => void
    remove: (name: string, options: { path: string; domain?: string }) => void
  }

  if (typeof reqOrCookieGetter === "function" && typeof resOrCookieSetter === "function") {
    // We're using the function-based approach (likely middleware or App Router)
    cookieHandlers = {
      get: reqOrCookieGetter,
      set: resOrCookieSetter,
      remove: (name: string, options: { path: string; domain?: string }) => {
        resOrCookieSetter(name, "", { ...options, maxAge: 0 })
      },
    }
  } else {
    // We're using the request/response approach (Pages Router)
    const req = reqOrCookieGetter as NextApiRequest
    const res = resOrCookieSetter as NextApiResponse

    cookieHandlers = {
      get: (name: string) => {
        return req.cookies[name]
      },
      set: (name: string, value: string, options: CookieOptions) => {
        res.setHeader(
          "Set-Cookie",
          `${name}=${value}; Path=${options.path || "/"}; Max-Age=${options.maxAge || 3600}${
            options.domain ? `; Domain=${options.domain}` : ""
          }${options.secure ? "; Secure" : ""}${options.sameSite ? `; SameSite=${options.sameSite}` : ""}`,
        )
      },
      remove: (name: string, options: { path: string; domain?: string }) => {
        res.setHeader(
          "Set-Cookie",
          `${name}=; Path=${options.path || "/"}; Max-Age=0${options.domain ? `; Domain=${options.domain}` : ""}`,
        )
      },
    }
  }

  // Create and return the Supabase client
  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: cookieHandlers,
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: "pkce",
    },
    global: {
      headers: {
        "x-application-name": "wellness-dashboard-server",
      },
    },
    db: {
      schema: "public",
    },
  })
}
