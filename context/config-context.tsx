/**
 * Config Context
 *
 * Provides application configuration to client components without
 * directly accessing environment variables.
 */
"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { clientEnv } from "@/lib/env"

// Define the configuration shape
interface AppConfig {
  appName: string
  version: string
  environment: string
  features: {
    debugEnabled: boolean
    profileEnabled: boolean
    goalsEnabled: boolean
    analyticsEnabled: boolean
  }
  urls: {
    siteUrl: string
    termsUrl: string
    privacyUrl: string
    supportUrl: string
  }
  user?: {
    id: string
    email: string | null
    lastSignIn: string | null
  }
  auth?: {
    sessionExpiry: number
  }
}

// Default configuration
const defaultConfig: AppConfig = {
  appName: "Wellness Dashboard",
  version: clientEnv.APP_VERSION,
  environment: clientEnv.APP_ENVIRONMENT,
  features: {
    debugEnabled: clientEnv.DEBUG_MODE,
    profileEnabled: true,
    goalsEnabled: true,
    analyticsEnabled: true,
  },
  urls: {
    siteUrl: clientEnv.SITE_URL || "http://localhost:3000",
    termsUrl: `${clientEnv.SITE_URL || "http://localhost:3000"}/terms`,
    privacyUrl: `${clientEnv.SITE_URL || "http://localhost:3000"}/privacy`,
    supportUrl: `${clientEnv.SITE_URL || "http://localhost:3000"}/support`,
  },
}

// Create the context
const ConfigContext = createContext<{
  config: AppConfig
  isLoading: boolean
  error: Error | null
  refreshConfig: () => Promise<void>
}>({
  config: defaultConfig,
  isLoading: true,
  error: null,
  refreshConfig: async () => {},
})

// Provider component
export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(defaultConfig)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Function to fetch configuration
  const fetchConfig = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/config")

      if (!response.ok) {
        throw new Error(`Failed to load configuration: ${response.status}`)
      }

      const data = await response.json()
      setConfig(data)
    } catch (err) {
      console.error("Error fetching configuration:", err)
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch configuration on mount
  useEffect(() => {
    fetchConfig()
  }, [])

  return (
    <ConfigContext.Provider
      value={{
        config,
        isLoading,
        error,
        refreshConfig: fetchConfig,
      }}
    >
      {children}
    </ConfigContext.Provider>
  )
}

// Hook to use the config
export function useConfig() {
  const context = useContext(ConfigContext)

  if (context === undefined) {
    throw new Error("useConfig must be used within a ConfigProvider")
  }

  return context
}
