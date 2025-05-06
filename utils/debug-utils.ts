// Global debug mode flag
let isDebugMode = false

// Debug namespaces
type DebugNamespace = "auth" | "supabase" | "data" | "ui" | "all"

// Debug settings for each namespace
const debugSettings: Record<DebugNamespace, boolean> = {
  auth: false,
  supabase: false,
  data: false,
  ui: false,
  all: false,
}

/**
 * Enable or disable debug mode globally or for specific namespaces
 */
export function setDebugMode(enabled: boolean, namespace: DebugNamespace = "all"): void {
  if (namespace === "all") {
    isDebugMode = enabled
    Object.keys(debugSettings).forEach((key) => {
      debugSettings[key as DebugNamespace] = enabled
    })
    console.log(`Debug mode ${enabled ? "enabled" : "disabled"} for all namespaces`)
  } else {
    debugSettings[namespace] = enabled
    isDebugMode = Object.values(debugSettings).some((value) => value)
    console.log(`Debug mode ${enabled ? "enabled" : "disabled"} for ${namespace} namespace`)
  }
}

/**
 * Check if debug mode is enabled for a specific namespace
 */
export function isDebugEnabled(namespace: DebugNamespace = "all"): boolean {
  return debugSettings[namespace] || debugSettings.all
}

/**
 * Debug logging function with namespace support
 */
export function debugLog(namespace: DebugNamespace, ...args: any[]): void {
  if (debugSettings[namespace] || debugSettings.all) {
    console.log(`[${namespace.toUpperCase()}]`, ...args)
  }
}

/**
 * Get current debug settings
 */
export function getDebugSettings(): Record<DebugNamespace, boolean> {
  return { ...debugSettings }
}
