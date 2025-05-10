/**
 * Safely access environment variables with runtime checks
 */

// Check if we're in a browser environment
export const isBrowser = typeof window !== "undefined"

// Safe access to NODE_ENV
export function getNodeEnv(): string | undefined {
  if (typeof process !== "undefined" && process.env) {
    return process.env.NODE_ENV
  }
  return undefined
}

// Check if we're in development mode
export function isDevelopment(): boolean {
  return getNodeEnv() === "development"
}

// Check if we're in production mode
export function isProduction(): boolean {
  return getNodeEnv() === "production"
}

// Safe console logging for development only
export function devLog(...args: any[]): void {
  if (isDevelopment()) {
    console.log("[DEV]", ...args)
  }
}

// Safe console warning for development only
export function devWarn(...args: any[]): void {
  if (isDevelopment()) {
    console.warn("[DEV WARNING]", ...args)
  }
}

// Safe console error (always logs in any environment)
export function safeError(...args: any[]): void {
  console.error("[ERROR]", ...args)
}
