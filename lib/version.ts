// Version information utility
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0"

// Safe environment detection utility
export const isDevelopment = () => {
  if (typeof window === "undefined") {
    // Server-side check
    return process.env.NODE_ENV === "development"
  }

  // Client-side check - use the NEXT_PUBLIC variable
  return process.env.NEXT_PUBLIC_APP_ENVIRONMENT === "development"
}

// Debug mode utilities
export const isDebugMode = () => {
  if (typeof window === "undefined") {
    // Server-side debug check
    return process.env.DEBUG_MODE === "true"
  }

  // Client-side debug check
  return process.env.NEXT_PUBLIC_DEBUG_MODE === "true" || localStorage.getItem("debug_mode") === "true"
}

// Enable debug mode
export const enableDebugMode = () => {
  if (typeof window !== "undefined") {
    localStorage.setItem("debug_mode", "true")
    console.log("Debug mode enabled")
  }
}

// Disable debug mode
export const disableDebugMode = () => {
  if (typeof window !== "undefined") {
    localStorage.setItem("debug_mode", "false")
    console.log("Debug mode disabled")
  }
}
