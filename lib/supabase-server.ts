/**
 * Supabase Server - Server-side client with enhanced features
 * This file provides utilities for creating Supabase clients in server contexts
 */

import { createServerClient } from "@supabase/ssr"
import type { CookieOptions } from "@supabase/ssr"
import type { Database } from "@/types/database"
import { serverEnv, validateEnv } from "@/lib/env"

// Connection health tracking for server
let lastServerConnectionAttempt = 0
let serverConnectionAttempts = 0
const SERVER_CONNECTION_BACKOFF_BASE = 1000 // ms

// This is a helper function to create a server client in route handlers and server actions
export async function createServerSupabaseClient(
  options: {
    retryOnError?: boolean
    timeout?: number
  } = {},
) {
  // Validate environment variables
  if (!validateEnv()) {
    throw new Error("Missing required environment variables for Supabase server client")
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

  // Use a dynamic import to avoid the "next/headers" issue in client components
  const { cookies } = await import("next/headers")
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
  })
}

// Custom fetch implementation with timeout for server
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
        console.log(`[Server] Rate limited. Retrying in ${backoffTime}ms (attempt ${retryCount + 1})`)

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
      console.log(`[Server] Network error. Retrying in ${backoffTime}ms (attempt ${retryCount + 1})`)

      // Wait for the backoff period
      await new Promise((resolve) => setTimeout(resolve, backoffTime))

      // Retry the request
      return fetchWithServerTimeout(url, options, timeout, retry, retryCount + 1)
    }

    throw error
  }
}
