"use client"

import type React from "react"
import { createContext, useContext, useEffect } from "react"
import { getAppVersion, getEnvironment, isDevelopment, isDebugMode } from "@/lib/env-utils-secure"
import { monitorGoTrueClientInstances } from "@/lib/supabase-client-consolidated"

// Define the environment context type
type EnvContextType = {
  appVersion: string
  environment: string
  isDebugMode: boolean
  enableDebugMode: () => void
  disableDebugMode: () => void
}

// Create the context
const EnvContext = createContext<EnvContextType>({
  appVersion: "1.0.0",
  environment: "production",
  isDebugMode: false,
  enableDebugMode: () => {},
  disableDebugMode: () => {},
})

// Custom hook to use the environment context
export const useEnv = () => useContext(EnvContext)

// Environment Provider Component
export function EnvProvider({ children }: { children: React.ReactNode }) {
  // Check for debug mode on mount
  useEffect(() => {
    // If we have NEXT_PUBLIC_DEBUG_MODE set to true, enable debug mode in localStorage
    if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
      enableDebugMode()
    }

    // Start monitoring GoTrueClient instances in development mode
    let stopMonitoring: (() => void) | undefined

    if (isDevelopment()) {
      stopMonitoring = monitorGoTrueClientInstances(30000) // Check every 30 seconds
    }

    return () => {
      // Clean up the monitor when the component unmounts
      if (stopMonitoring) {
        stopMonitoring()
      }
    }
  }, [])

  // Enable debug mode
  const enableDebugMode = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("debug_mode", "true")
    }
  }

  // Disable debug mode
  const disableDebugMode = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("debug_mode", "false")
    }
  }

  const value = {
    appVersion: getAppVersion(),
    environment: getEnvironment(),
    isDebugMode: isDebugMode(),
    enableDebugMode,
    disableDebugMode,
  }

  return <EnvContext.Provider value={value}>{children}</EnvContext.Provider>
}
