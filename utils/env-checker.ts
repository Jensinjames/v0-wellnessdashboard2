/**
 * Safe environment utilities that work on both client and server
 * without causing "NODE_ENV cannot be accessed on the client" errors
 */

// Safe environment detection
export const ENV = {
  isDevelopment: process.env.NEXT_PUBLIC_APP_ENVIRONMENT === "development",
  isProduction: process.env.NEXT_PUBLIC_APP_ENVIRONMENT === "production",
  isTest: process.env.NEXT_PUBLIC_APP_ENVIRONMENT === "test",
  debugMode: process.env.NEXT_PUBLIC_DEBUG_MODE === "true",
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION || "0.0.0",
}

// Safe debug mode check that works on both client and server
export function isDebugMode(): boolean {
  if (typeof window !== "undefined") {
    return ENV.debugMode || localStorage.getItem("debug_mode") === "true" || ENV.isDevelopment
  }
  return ENV.debugMode || ENV.isDevelopment
}

// Safe console utilities that don't reference process.env directly
export function safeConsole() {
  return {
    log: (message: string, ...args: any[]) => {
      if (!ENV.isProduction) {
        console.log(message, ...args)
      }
    },
    warn: (message: string, ...args: any[]) => {
      if (!ENV.isProduction) {
        console.warn(message, ...args)
      }
    },
    error: (message: string, ...args: any[]) => {
      if (!ENV.isProduction) {
        console.error(message, ...args)
      }
    },
    debug: (message: string, ...args: any[]) => {
      if (isDebugMode()) {
        console.log(`[DEBUG] ${message}`, ...args)
      }
    },
  }
}

// Export a singleton instance
export const logger = safeConsole()
