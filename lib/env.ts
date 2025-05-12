/**
 * Safe environment variable access utility
 *
 * This utility provides a safe way to access environment variables
 * in both server and client components, handling the NODE_ENV issue.
 */

// Server-side environment variables
export const serverEnv = {
  NODE_ENV: process.env.NODE_ENV || "development",
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
}

// Client-side environment variables (only those prefixed with NEXT_PUBLIC_)
export const clientEnv = {
  // Use a function to safely access NODE_ENV equivalent on the client
  // This avoids direct access to process.env.NODE_ENV which causes issues
  getNodeEnv: () => {
    // In the browser, we can check for development features
    if (typeof window !== "undefined") {
      // Check if we're in development mode based on dev tools or other signals
      const isDev =
        // Check for dev-specific features
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        // Check for Vercel preview environments
        window.location.hostname.includes("vercel.app") ||
        // Check for a custom environment variable
        process.env.NEXT_PUBLIC_APP_ENV === "development"

      return isDev ? "development" : "production"
    }

    // Fallback for SSR
    return process.env.NODE_ENV || "production"
  },

  // Safe access to public environment variables
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
}

// Helper function to determine if we're in development mode
export const isDevelopment = () => {
  if (typeof window === "undefined") {
    // Server-side
    return serverEnv.NODE_ENV === "development"
  }
  // Client-side
  return clientEnv.getNodeEnv() === "development"
}

// Helper function to determine if we're in production mode
export const isProduction = () => {
  if (typeof window === "undefined") {
    // Server-side
    return serverEnv.NODE_ENV === "production"
  }
  // Client-side
  return clientEnv.getNodeEnv() === "production"
}

// Helper function to determine if we're in test mode
export const isTest = () => {
  if (typeof window === "undefined") {
    // Server-side
    return serverEnv.NODE_ENV === "test"
  }
  // Client-side - tests typically set a specific flag
  return process.env.NEXT_PUBLIC_APP_ENV === "test"
}
