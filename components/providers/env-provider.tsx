"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

// Define the shape of our environment context
interface EnvContextType {
  isProduction: boolean
  isDevelopment: boolean
  isTest: boolean
  debugMode: boolean
  appVersion: string
  appEnvironment: string
}

// Create the context with default values
const EnvContext = createContext<EnvContextType>({
  isProduction: false,
  isDevelopment: true,
  isTest: false,
  debugMode: false,
  appVersion: "0.0.0",
  appEnvironment: "development",
})

// Hook to use the environment context
export const useEnv = () => useContext(EnvContext)

interface EnvProviderProps {
  children: React.ReactNode
}

export function EnvProvider({ children }: EnvProviderProps) {
  const [env, setEnv] = useState<EnvContextType>({
    isProduction: false,
    isDevelopment: true,
    isTest: false,
    debugMode: false,
    appVersion: "0.0.0",
    appEnvironment: "development",
  })

  useEffect(() => {
    // Get environment variables
    const appEnvironment = process.env.NEXT_PUBLIC_APP_ENVIRONMENT || "development"
    const debugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === "true"
    const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || "0.0.0"

    // Set environment context
    setEnv({
      isProduction: appEnvironment === "production",
      isDevelopment: appEnvironment === "development",
      isTest: appEnvironment === "test",
      debugMode,
      appVersion,
      appEnvironment,
    })

    // Log environment info in development
    if (appEnvironment === "development" || debugMode) {
      console.log("[Environment]", {
        appEnvironment,
        debugMode,
        appVersion,
      })
    }
  }, [])

  return <EnvContext.Provider value={env}>{children}</EnvContext.Provider>
}
