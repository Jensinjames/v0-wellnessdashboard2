import { getAppVersion, isDebugMode } from "./env-utils"

// Application version
export const APP_VERSION = getAppVersion()

// Debug mode functions
export function enableDebugMode(): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("debug_mode", "true")
    console.log("Debug mode enabled")
  }
}

export function disableDebugMode(): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("debug_mode", "false")
    console.log("Debug mode disabled")
  }
}

// Use the utility function for checking debug mode
export { isDebugMode }
