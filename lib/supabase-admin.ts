/**
 * Supabase Admin Client
 *
 * This module provides a Supabase client with admin privileges.
 * It should ONLY be used in server-side code, never in client components.
 */

import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Ensure this is only used on the server
if (typeof window !== "undefined") {
  throw new Error("supabase-admin can only be used on the server")
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for admin operations")
}

// Connection health tracking for admin
let lastAdminConnectionAttempt = 0
let adminConnectionAttempts = 0
const ADMIN_CONNECTION_BACKOFF_BASE = 1000 // ms

// Debug mode flag
const isDebugMode = process.env.DEBUG_MODE === "true"

// Internal debug logging function
function debugLog(...args: any[]): void {
  if (isDebugMode) {
    console.log("[Supabase Admin]", ...args)
  }
}

// Calculate timeout with exponential backoff
const now = Date.now()
const timeSinceLastAttempt = now - lastAdminConnectionAttempt

// Reset connection attempts if it's been a while
if (timeSinceLastAttempt > 60000) {
  // 1 minute
  adminConnectionAttempts = 0
}

// Increment connection attempts
adminConnectionAttempts++
lastAdminConnectionAttempt = now

// Calculate timeout with exponential backoff
const timeout =
  adminConnectionAttempts > 1
    ? Math.min(ADMIN_CONNECTION_BACKOFF_BASE * Math.pow(2, adminConnectionAttempts - 1), 15000)
    : 10000

// Create a single supabase admin client for interacting with your database with elevated privileges
const supabaseAdmin = createClient<Database>(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    headers: {
      "x-application-name": "wellness-dashboard-admin",
    },
    fetch: (url, options = {}) => {
      // Create a custom fetch with timeout
      return fetchWithAdminTimeout(url, options, timeout)
    },
  },
  db: {
    schema: "public",
  },
})

/**
 * Execute a function with the admin client
 * This provides a clear pattern for admin operations
 */
export async function withAdmin<T>(fn: (admin: typeof supabaseAdmin) => Promise<T>): Promise<T> {
  try {
    debugLog("Executing admin operation")
    return await fn(supabaseAdmin)
  } catch (error) {
    console.error("Error in admin operation:", error)
    throw error
  }
}

/**
 * Custom fetch implementation with timeout for admin
 */
async function fetchWithAdminTimeout(
  url: RequestInfo | URL,
  options: RequestInit = {},
  timeout = 15000,
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
    if (response.status === 429 && retryCount < MAX_RETRIES) {
      // Calculate backoff time - exponential with jitter
      const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 10000) * (0.8 + Math.random() * 0.4)
      debugLog(`Rate limited. Retrying in ${backoffTime}ms (attempt ${retryCount + 1})`)

      // Wait for the backoff period
      await new Promise((resolve) => setTimeout(resolve, backoffTime))

      // Retry the request
      return fetchWithAdminTimeout(url, options, timeout, retryCount + 1)
    }

    // Reset connection attempts on successful response
    if (response.ok) {
      adminConnectionAttempts = 0
    }

    return response
  } catch (error) {
    // Clear the timeout
    clearTimeout(timeoutId)

    // Check if it's a timeout or network error and we should retry
    if (
      retryCount < MAX_RETRIES &&
      (error instanceof TypeError || (error instanceof DOMException && error.name === "AbortError"))
    ) {
      // Calculate backoff time - exponential with jitter
      const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 10000) * (0.8 + Math.random() * 0.4)
      debugLog(`Network error. Retrying in ${backoffTime}ms (attempt ${retryCount + 1})`)

      // Wait for the backoff period
      await new Promise((resolve) => setTimeout(resolve, backoffTime))

      // Retry the request
      return fetchWithAdminTimeout(url, options, timeout, retryCount + 1)
    }

    throw error
  }
}

// Export the withAdmin function as the primary way to use the admin client
