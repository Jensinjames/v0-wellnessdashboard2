import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Track client instance for debugging
let clientInstanceCount = 0

// Type for client options
interface ClientOptions {
  persistSession?: boolean
  autoRefreshToken?: boolean
  debugMode?: boolean
}

// Default options
const DEFAULT_OPTIONS: ClientOptions = {
  persistSession: true,
  autoRefreshToken: true,
  debugMode: false,
}

// Singleton instance
let supabaseInstance: SupabaseClient<Database> | null = null

// Client creation timestamp
let clientCreatedAt: number | null = null

// Debug mode flag - safely check localStorage
const getDebugMode = (): boolean => {
  if (typeof window !== "undefined") {
    return (
      localStorage.getItem("auth_debug") === "true" ||
      window.location.search.includes("debug=true") ||
      process.env.NEXT_PUBLIC_DEBUG_MODE === "true"
    )
  }
  return false
}

// Initialize the client if needed
function initializeClient(options: ClientOptions = {}): SupabaseClient<Database> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

  // If we're in a browser context and already have an instance, return it
  if (typeof window !== "undefined" && window.__SUPABASE_SINGLETON_CLIENT) {
    if (getDebugMode()) {
      console.log("[Supabase Singleton] Returning existing client instance")
    }
    return window.__SUPABASE_SINGLETON_CLIENT
  }

  // Create a new client
  if (getDebugMode()) {
    console.log("[Supabase Singleton] Creating new client instance")
  }

  clientInstanceCount++

  const client = createClientComponentClient<Database>({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    options: {
      auth: {
        persistSession: mergedOptions.persistSession,
        autoRefreshToken: mergedOptions.autoRefreshToken,
        storageKey: "supabase-auth-token-v2",
        flowType: "pkce",
        debug: mergedOptions.debugMode,
      },
      global: {
        headers: {
          "x-client-info": `supabase-singleton/${process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0"}`,
        },
      },
    },
  })

  // Store the client in the global space for reuse
  if (typeof window !== "undefined") {
    window.__SUPABASE_SINGLETON_CLIENT = client
  }

  // Store in module scope
  supabaseInstance = client
  clientCreatedAt = Date.now()

  return client
}

// Get the client instance (creating if needed)
export function getSupabaseClient(options: ClientOptions = {}): SupabaseClient<Database> {
  if (supabaseInstance) {
    return supabaseInstance
  }

  return initializeClient(options)
}

// Reset the client (useful for sign out)
export function resetSupabaseClient(): void {
  if (getDebugMode()) {
    console.log("[Supabase Singleton] Resetting client instance")
  }

  // Clear from global space
  if (typeof window !== "undefined") {
    delete window.__SUPABASE_SINGLETON_CLIENT
  }

  // Clear from module scope
  supabaseInstance = null
  clientCreatedAt = null
}

// Get client stats for debugging
export function getClientStats() {
  return {
    instanceCount: clientInstanceCount,
    hasInstance: !!supabaseInstance,
    createdAt: clientCreatedAt,
    globalInstance: typeof window !== "undefined" ? !!window.__SUPABASE_SINGLETON_CLIENT : false,
  }
}

// Add TypeScript declaration for the global window object
declare global {
  interface Window {
    __SUPABASE_SINGLETON_CLIENT: SupabaseClient<Database>
  }
}
