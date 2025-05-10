/**
 * Server-side Supabase Client Utilities
 *
 * This module provides utilities for working with Supabase on the server side.
 */

import { createServerComponentClient, createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { cache } from "react"
import type { CookieOptions } from "@supabase/ssr"
import type { Database } from "@/types/database"

// Connection health tracking for server
let lastServerConnectionAttempt = 0
let serverConnectionAttempts = 0
const SERVER_CONNECTION_BACKOFF_BASE = 1000 // ms

// Debug mode flag
const isDebugMode = process.env.DEBUG_MODE === "true"

// Internal debug logging function
function debugLog(...args: any[]): void {
  if (isDebugMode) {
    console.log("[Supabase Server]", ...args)
  }
}

/**
 * Create a Supabase client for server components
 * This is cached to prevent multiple instances in a single request
 */
export const createServerSupabaseClient = cache((options: { retryOnError?: boolean; timeout?: number } = {}) => {
  debugLog("Creating server component client")

  const cookieStore = cookies()

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error("Supabase URL and anon key are required")
  }

  // Calculate timeout with exponential backoff if we've had failed attempts recently
  const now = Date.now()
  const timeSinceLastAttempt = now - lastServerConnectionAttempt

  // Reset connection attempts if it's been a while
  if (timeSinceLastAttempt > 60000) {
    // 1 minute
    serverConnectionAttempts = 0
  }

  // Increment connection attempts
  serverConnectionAttempts++
  lastServerConnectionAttempt = now

  // Calculate timeout with exponential backoff
  const timeout =
    options.timeout ||
    (serverConnectionAttempts > 1
      ? Math.min(SERVER_CONNECTION_BACKOFF_BASE * Math.pow(2, serverConnectionAttempts - 1), 15000)
      : 10000)

  return createServerComponentClient<Database>(
    { cookies: () => cookieStore },
    {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_ANON_KEY,
      options: {
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
          fetch: (url, options = {}) => {
            // Create a custom fetch with timeout
            return fetchWithServerTimeout(url, options, timeout, options.retryOnError || false)
          },
        },
        db: {
          schema: "public",
        },
      },
    },
  )
})

/**
 * Create a Supabase client for server actions
 */
export function createServerActionSupabaseClient(options: { retryOnError?: boolean; timeout?: number } = {}) {
  debugLog("Creating server action client")

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error("Supabase URL and anon key are required")
  }

  // Calculate timeout with exponential backoff
  const timeout = options.timeout || 10000

  return createServerActionClient<Database>(
    { cookies },
    {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_ANON_KEY,
      options: {
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
          fetch: (url, options = {}) => {
            // Create a custom fetch with timeout
            return fetchWithServerTimeout(url, options, timeout, options.retryOnError || false)
          },
        },
        db: {
          schema: "public",
        },
      },
    },
  )
}

/**
 * Helper for custom cookie handlers (used in middleware and route handlers)
 */
export function createCustomCookieClient(
  cookieGetter: (name: string) => string | undefined,
  cookieSetter: (name: string, value: string, options: CookieOptions) => void,
  options: {
    retryOnError?: boolean
    timeout?: number
  } = {},
) {
  debugLog("Creating custom cookie client")

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error("Supabase URL and anon key are required")
  }

  // Calculate timeout with exponential backoff
  const timeout = options.timeout || 10000

  return createServerComponentClient<Database>(
    {
      cookies: {
        get(name: string) {
          return cookieGetter(name)
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieSetter(name, value, options)
        },
        remove(name: string, options: { path: string; domain?: string }) {
          cookieSetter(name, "", { ...options, maxAge: 0 })
        },
      },
    },
    {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_ANON_KEY,
      options: {
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
          fetch: (url, options = {}) => {
            // Create a custom fetch with timeout
            return fetchWithServerTimeout(url, options, timeout, options.retryOnError || false)
          },
        },
        db: {
          schema: "public",
        },
      },
    },
  )
}

/**
 * Execute a function with a pooled Supabase connection
 */
export async function withPooledConnection<T>(
  fn: (supabase: ReturnType<typeof createServerSupabaseClient>) => Promise<T>,
): Promise<T> {
  const supabase = createServerSupabaseClient()
  try {
    return await fn(supabase)
  } catch (error) {
    console.error("Error in withPooledConnection:", error)
    throw error
  }
}

/**
 * Get the current user from the server
 */
export async function getServerUser() {
  const supabase = createServerSupabaseClient()
  const { data } = await supabase.auth.getUser()
  return data.user
}

/**
 * Check if the user is authenticated on the server
 */
export async function isAuthenticated() {
  const user = await getServerUser()
  return !!user
}

/**
 * Custom fetch implementation with timeout for server
 */
async function fetchWithServerTimeout(
  url: RequestInfo | URL,
  options: RequestInit = {},
  timeout = 10000,
  retry = false,
  retryCount = 0,
): Promise<Response> {
  const MAX_RETRIES = 2
  const controller = new AbortController()
  const { signal } = controller

  // Merge the provided signal with our abort controller
  const originalSignal = options.signal

  if (originalSignal) {
    // If the original signal aborts, abort our controller too
    if (originalSignal.aborted) {
      controller.abort()
    } else {
      originalSignal.addEventListener("abort", () => controller.abort())
    }
  }

  const timeoutId = setTimeout(() => {
    controller.abort()
  }, timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal,
    })

    // Clear the timeout
    clearTimeout(timeoutId)

    // Check if we got a rate limit response
    if (response.status === 429) {
      if (retry && retryCount < MAX_RETRIES) {
        // Calculate backoff time - exponential with jitter
        const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 10000) * (0.8 + Math.random() * 0.4)
        debugLog(`Rate limited. Retrying in ${backoffTime}ms (attempt ${retryCount + 1})`)

        // Wait for the backoff period
        await new Promise((resolve) => setTimeout(resolve, backoffTime))

        // Retry the request
        return fetchWithServerTimeout(url, options, timeout, retry, retryCount + 1)
      }
    }

    // Reset connection attempts on successful response
    if (response.ok) {
      serverConnectionAttempts = 0
    }

    return response
  } catch (error) {
    // Clear the timeout
    clearTimeout(timeoutId)

    // Check if it's a timeout or network error and we should retry
    if (
      retry &&
      retryCount < MAX_RETRIES &&
      (error instanceof TypeError || (error instanceof DOMException && error.name === "AbortError"))
    ) {
      // Calculate backoff time - exponential with jitter
      const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 10000) * (0.8 + Math.random() * 0.4)
      debugLog(`Network error. Retrying in ${backoffTime}ms (attempt ${retryCount + 1})`)

      // Wait for the backoff period
      await new Promise((resolve) => setTimeout(resolve, backoffTime))

      // Retry the request
      return fetchWithServerTimeout(url, options, timeout, retry, retryCount + 1)
    }

    throw error
  }
}
