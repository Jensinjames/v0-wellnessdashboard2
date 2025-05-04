"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import * as LucideIcons from "lucide-react"

export type IconPreference = {
  name: string
  color: string
  size: string
  background?: string
}

type IconContextType = {
  iconPreferences: Record<string, IconPreference>
  setIconPreference: (id: string, preference: IconPreference) => void
  getIconComponent: (name: string) => React.ElementType | null
  recentlyUsedIcons: string[]
  addToRecentlyUsed: (iconName: string) => void
}

const defaultIconPreferences: Record<string, IconPreference> = {
  default: {
    name: "Activity",
    color: "blue",
    size: "md",
  },
}

const IconContext = createContext<IconContextType>({
  iconPreferences: defaultIconPreferences,
  setIconPreference: () => {},
  getIconComponent: () => null,
  recentlyUsedIcons: [],
  addToRecentlyUsed: () => {},
})

export const useIconContext = () => useContext(IconContext)

export const IconProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [iconPreferences, setIconPreferences] = useState<Record<string, IconPreference>>(defaultIconPreferences)
  const [recentlyUsedIcons, setRecentlyUsedIcons] = useState<string[]>([])

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return

    const savedPreferences = localStorage.getItem("iconPreferences")
    const savedRecentlyUsed = localStorage.getItem("recentlyUsedIcons")

    if (savedPreferences) {
      try {
        setIconPreferences(JSON.parse(savedPreferences))
      } catch (e) {
        console.error("Failed to parse saved icon preferences", e)
      }
    }

    if (savedRecentlyUsed) {
      try {
        setRecentlyUsedIcons(JSON.parse(savedRecentlyUsed))
      } catch (e) {
        console.error("Failed to parse saved recently used icons", e)
      }
    }
  }, [])

  // Save preferences to localStorage when they change
  useEffect(() => {
    if (typeof window === "undefined") return
    localStorage.setItem("iconPreferences", JSON.stringify(iconPreferences))
  }, [iconPreferences])

  // Save recently used icons to localStorage when they change
  useEffect(() => {
    if (typeof window === "undefined") return
    localStorage.setItem("recentlyUsedIcons", JSON.stringify(recentlyUsedIcons))
  }, [recentlyUsedIcons])

  const setIconPreference = (id: string, preference: IconPreference) => {
    setIconPreferences((prev) => ({
      ...prev,
      [id]: preference,
    }))
  }

  // FIXED: Return the component type, not an instance
  const getIconComponent = (name: string): React.ElementType | null => {
    if (!name) return null
    return (LucideIcons[name as keyof typeof LucideIcons] as React.ElementType) || null
  }

  const addToRecentlyUsed = (iconName: string) => {
    setRecentlyUsedIcons((prev) => {
      // Remove if already exists
      const filtered = prev.filter((name) => name !== iconName)
      // Add to beginning and limit to 10 items
      return [iconName, ...filtered].slice(0, 10)
    })
  }

  return (
    <IconContext.Provider
      value={{
        iconPreferences,
        setIconPreference,
        getIconComponent,
        recentlyUsedIcons,
        addToRecentlyUsed,
      }}
    >
      {children}
    </IconContext.Provider>
  )
}
