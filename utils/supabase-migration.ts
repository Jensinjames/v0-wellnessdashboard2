/**
 * Supabase Migration Utility
 *
 * This utility helps migrate from the old Supabase client implementations
 * to the new singleton manager.
 */
import { getSupabaseClient } from "@/lib/supabase-singleton-manager"
import { createLogger } from "@/utils/logger"

// Create a dedicated logger
const logger = createLogger("SupabaseMigration")

// Legacy client getters to redirect to the singleton
const legacyGetters = ["getSupabase", "getSupabaseClient", "getSupabaseSingleton", "createSupabaseClient"]

/**
 * Migrate legacy Supabase client usage to the new singleton manager
 */
export function migrateLegacySupabaseClients(): void {
  if (typeof window === "undefined") return

  // Create proxies for all legacy getters
  legacyGetters.forEach((getterName) => {
    // @ts-ignore - Dynamically adding properties to window
    if (!window[getterName]) {
      // @ts-ignore - Dynamically adding properties to window
      window[getterName] = () => {
        logger.warn(
          `Legacy Supabase client getter "${getterName}" used. Please update to use getSupabaseClient from supabase-singleton-manager.`,
        )
        return getSupabaseClient()
      }
    }
  })

  logger.info("Legacy Supabase client migration complete")
}

/**
 * Check for multiple Supabase client implementations
 */
export function checkForMultipleImplementations(): {
  multipleImplementations: boolean
  implementations: string[]
} {
  if (typeof window === "undefined") {
    return { multipleImplementations: false, implementations: [] }
  }

  const implementations: string[] = []

  // Check for known implementation files
  const knownImplementations = [
    "supabase-client.ts",
    "supabase-client-enhanced.ts",
    "supabase-singleton.ts",
    "supabase-manager.ts",
    "supabase-provider.tsx",
  ]

  // Check for script tags containing these implementations
  const scripts = document.querySelectorAll("script")
  scripts.forEach((script) => {
    const src = script.src || ""
    knownImplementations.forEach((impl) => {
      if (src.includes(impl)) {
        implementations.push(impl)
      }
    })
  })

  // Check for global functions that might indicate multiple implementations
  legacyGetters.forEach((getterName) => {
    // @ts-ignore - Dynamically checking properties on window
    if (window[getterName] && typeof window[getterName] === "function") {
      if (!implementations.includes(getterName)) {
        implementations.push(getterName)
      }
    }
  })

  return {
    multipleImplementations: implementations.length > 1,
    implementations,
  }
}
