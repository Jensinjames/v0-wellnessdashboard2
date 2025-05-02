"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type NotificationFrequency = "all" | "important" | "none"
export type MeasurementUnit = "metric" | "imperial"
export type DataSharing = "all" | "anonymous" | "none"

interface SettingsContextType {
  notificationEmail: boolean
  notificationPush: boolean
  notificationFrequency: NotificationFrequency
  measurementUnit: MeasurementUnit
  dataSharing: DataSharing
  compactView: boolean
  updateSettings: (settings: Partial<Omit<SettingsContextType, "updateSettings">>) => void
}

const defaultSettings: Omit<SettingsContextType, "updateSettings"> = {
  notificationEmail: true,
  notificationPush: false,
  notificationFrequency: "important",
  measurementUnit: "metric",
  dataSharing: "anonymous",
  compactView: false,
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(defaultSettings)

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("userSettings")
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings)
        setSettings((prev) => ({ ...prev, ...parsedSettings }))
      } catch (error) {
        console.error("Failed to parse settings from localStorage", error)
      }
    }
  }, [])

  const updateSettings = (newSettings: Partial<typeof settings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings }
      // Save to localStorage
      localStorage.setItem("userSettings", JSON.stringify(updated))
      return updated
    })
  }

  return <SettingsContext.Provider value={{ ...settings, updateSettings }}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}
