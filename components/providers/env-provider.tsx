"use client"

import type React from "react"

import { createContext, useContext, useEffect } from "react"
import { APP_VERSION, enableDebugMode, disableDebugMode, isDebugMode } from "@/lib/version"

// Define the environment context type
type EnvContextType = {
  appVersion: string
  isDebugMode: boolean
  enableDebugMode: () => void
  disableDebugMode: () => void
}

// Create the context
const EnvContext = createContext<EnvContextType>({
  appVersion: "1.0.0",
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
  }, [])

  const value = {
    appVersion: APP_VERSION,
    isDebugMode: isDebugMode(),
    enableDebugMode,
    disableDebugMode,
  }

  return <EnvContext.Provider value={value}>{children}</EnvContext.Provider>
}
