// Safe environment detection utility

// Define environment types
export type Environment = "development" | "production" | "test"

// Get the current environment safely
export function getEnvironment(): Environment {
  // For client-side, use NEXT_PUBLIC prefixed variable
  if (typeof window !== "undefined") {
    return (process.env.NEXT_PUBLIC_APP_ENVIRONMENT as Environment) || "production"
  }

  // For server-side, use NODE_ENV
  return (process.env.NODE_ENV as Environment) || "production"
}

// Check if we're in development mode
export function isDevelopment(): boolean {
  return getEnvironment() === "development"
}

// Check if we're in production mode
export function isProduction(): boolean {
  return getEnvironment() === "production"
}

// Check if we're in test mode
export function isTest(): boolean {
  return getEnvironment() === "test"
}

// Check if we're on the client side
export function isClient(): boolean {
  return typeof window !== "undefined"
}

// Check if we're on the server side
export function isServer(): boolean {
  return typeof window === "undefined"
}

// Get debug mode status
export function isDebugMode(): boolean {
  if (isClient()) {
    // Check for client-side debug flag in localStorage
    const localStorageDebug = localStorage.getItem("debug_mode")
    if (localStorageDebug !== null) {
      return localStorageDebug === "true"
    }

    // Fall back to environment variable
    return process.env.NEXT_PUBLIC_DEBUG_MODE === "true"
  }

  // Server-side debug mode
  return process.env.DEBUG_MODE === "true"
}
