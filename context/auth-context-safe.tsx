"use client"

// Import the safe environment utilities instead of directly accessing process.env
import { environment } from "@/utils/safe-env"
import { logger } from "@/utils/env-checker"

// Create a logger specifically for auth-related messages
const authLogger = logger.extend("auth")

// Rest of the auth context implementation...
// Replace any direct process.env.NODE_ENV references with environment.isDevelopment, etc.
// Replace console.log/warn/error with logger.log/warn/error

// Example of a function that previously used process.env.NODE_ENV:
export function setAuthDebugMode(enabled: boolean): void {
  if (typeof localStorage !== "undefined") {
    if (enabled) {
      localStorage.setItem("auth_debug_mode", "true")
    } else {
      localStorage.removeItem("auth_debug_mode")
    }
  }

  // Update logger configuration - no direct process.env access
  authLogger.setLevel(enabled || environment.isDevelopment ? "debug" : "warn")
}
