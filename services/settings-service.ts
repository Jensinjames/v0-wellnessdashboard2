import type { UserSettings } from "@/types/settings"

const STORAGE_KEY = "userSettings"

export const settingsService = {
  getSettings: (): UserSettings | null => {
    if (typeof window === "undefined") return null

    try {
      const settings = localStorage.getItem(STORAGE_KEY)
      return settings ? JSON.parse(settings) : null
    } catch (error) {
      console.error("Failed to get settings:", error)
      return null
    }
  },

  saveSettings: (settings: UserSettings): boolean => {
    if (typeof window === "undefined") return false

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
      return true
    } catch (error) {
      console.error("Failed to save settings:", error)
      return false
    }
  },

  clearSettings: (): boolean => {
    if (typeof window === "undefined") return false

    try {
      localStorage.removeItem(STORAGE_KEY)
      return true
    } catch (error) {
      console.error("Failed to clear settings:", error)
      return false
    }
  },
}
