import { isDebugMode } from "@/lib/env-utils-secure"

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

// Monitor GoTrueClient instances in the console
export function monitorGoTrueClientInstances(): void {
  if (typeof window === "undefined" || !isDebugMode()) {
    return
  }
  // Add a global helper function to check for GoTrueClient instances
  ;(window as any).__checkGoTrueClients = () => {
    const instances = Array.from(document.querySelectorAll("*"))
      .filter((el) => (el as any)._goTrueClient)
      .map((el) => (el as any)._goTrueClient)

    console.log(`Found ${instances.length} GoTrueClient instances`)
    return instances
  }

  console.log("GoTrueClient monitor installed. Run window.__checkGoTrueClients() to check for instances.")
}

// Call this function when your app initializes
initializeDebugSettings()
