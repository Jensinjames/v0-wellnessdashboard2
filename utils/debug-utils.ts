import { isDebugMode } from "@/lib/env-utils"

// Debug settings object
interface DebugSettings {
  all: boolean
  auth: boolean
  supabase: boolean
  api: boolean
  cache: boolean
  performance: boolean
  ui: boolean
}

// Default debug settings
const defaultDebugSettings: DebugSettings = {
  all: false,
  auth: false,
  supabase: false,
  api: false,
  cache: false,
  performance: false,
  ui: false,
}

// Get debug settings from localStorage or use defaults
export function getDebugSettings(): DebugSettings {
  if (typeof window === "undefined") {
    return defaultDebugSettings
  }

  try {
    const storedSettings = localStorage.getItem("debug_settings")
    return storedSettings ? JSON.parse(storedSettings) : defaultDebugSettings
  } catch (error) {
    console.error("Error reading debug settings:", error)
    return defaultDebugSettings
  }
}

// Set debug mode for a specific namespace
export function setDebugMode(enabled: boolean, namespace: keyof DebugSettings = "all"): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    const settings = getDebugSettings()
    settings[namespace] = enabled

    // If setting "all", update all namespaces
    if (namespace === "all") {
      Object.keys(settings).forEach((key) => {
        settings[key as keyof DebugSettings] = enabled
      })
    }

    localStorage.setItem("debug_settings", JSON.stringify(settings))
    console.log(`Debug mode for ${namespace}: ${enabled ? "enabled" : "disabled"}`)
  } catch (error) {
    console.error("Error setting debug mode:", error)
  }
}

// Debug logging function
export function debugLog(namespace: keyof DebugSettings, ...args: any[]): void {
  const settings = getDebugSettings()

  if (settings[namespace] || settings.all || isDebugMode()) {
    console.log(`[${namespace.toUpperCase()}]`, ...args)
  }
}

// Initialize debug settings based on environment
export function initializeDebugSettings(): void {
  if (typeof window === "undefined") {
    return
  }

  // Initialize from environment if not already set
  if (!localStorage.getItem("debug_settings")) {
    const shouldEnableDebug = isDebugMode()

    if (shouldEnableDebug) {
      setDebugMode(true, "all")
    }
  }
}

// Call this function when your app initializes
initializeDebugSettings()
