"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { UserSettings } from "@/types/settings"

interface SettingsContextType {
  settings: UserSettings
  updateSettings: (settings: Partial<UserSettings>) => Promise<{ success: boolean; error?: any }>
  isLoaded: boolean
}

const defaultSettings: UserSettings = {
  // Notification settings
  emailNotifications: true,
  pushNotifications: false,
  notificationFrequency: "important",

  // Data & Privacy settings
  dataSharing: "anonymous",
  measurementUnit: "metric",

  // Account settings
  name: "User Name",
  email: "user@example.com",

  // Appearance settings
  compactView: false,
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem("userSettings")
      if (savedSettings) {
        setSettings({
          ...defaultSettings,
          ...JSON.parse(savedSettings),
        })
      }
      setIsLoaded(true)
    } catch (error) {
      console.error("Failed to load settings:", error)
      setIsLoaded(true)
    }
  }, [])

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      const updatedSettings = {
        ...settings,
        ...newSettings,
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Save to localStorage
      localStorage.setItem("userSettings", JSON.stringify(updatedSettings))

      // Update state
      setSettings(updatedSettings)

      return { success: true }
    } catch (error) {
      console.error("Failed to save settings:", error)
      return { success: false, error }
    }
  }

  return <SettingsContext.Provider value={{ settings, updateSettings, isLoaded }}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}
