"use client"

import type React from "react"

import { createContext, useContext, useMemo } from "react"
import { usePersistentState, useStableCallback } from "@/lib/state-utils"

export type NotificationFrequency = "all" | "important" | "none"
export type MeasurementUnit = "metric" | "imperial"
export type DataSharing = "all" | "anonymous" | "none"

interface UserSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  notificationFrequency: NotificationFrequency
  measurementUnit: MeasurementUnit
  dataSharing: DataSharing
  compactView: boolean
  name?: string
  email?: string
  currentPassword?: string
  newPassword?: string
  confirmPassword?: string
  theme?: string
}

interface SettingsContextType {
  settings: UserSettings
  updateSettings: (settings: Partial<UserSettings>) => Promise<{ success: boolean; error?: any }>
  isLoaded: boolean
  isLoading: boolean
}

const defaultSettings: UserSettings = {
  emailNotifications: true,
  pushNotifications: false,
  notificationFrequency: "important",
  measurementUnit: "metric",
  dataSharing: "anonymous",
  compactView: false,
  name: "User Name",
  email: "user@example.com",
  theme: "light",
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings, isLoading] = usePersistentState<UserSettings>("userSettings", defaultSettings)

  // Update settings with stable callback to prevent unnecessary re-renders
  const updateSettings = useStableCallback(
    async (newSettings: Partial<UserSettings>) => {
      try {
        const updatedSettings = {
          ...settings,
          ...newSettings,
        }

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Update state (persistence is handled by usePersistentState)
        setSettings(updatedSettings)

        return { success: true }
      } catch (error) {
        console.error("Failed to save settings:", error)
        return { success: false, error }
      }
    },
    [settings, setSettings],
  )

  // Create a memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      settings,
      updateSettings,
      isLoaded: !isLoading,
      isLoading,
    }),
    [settings, updateSettings, isLoading],
  )

  return <SettingsContext.Provider value={contextValue}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}
