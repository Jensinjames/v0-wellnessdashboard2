"use client"

import type React from "react"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"
import { createContext, useContext } from "react"

// Create a context for the enhanced theme
type EnhancedThemeContextType = {
  currentTheme: string
  toggleHighContrast: () => void
  isHighContrast: boolean
  toggleLargeText: () => void
  isLargeText: boolean
  toggleReducedMotion: () => void
  isReducedMotion: boolean
}

const EnhancedThemeContext = createContext<EnhancedThemeContextType>({
  currentTheme: "light",
  toggleHighContrast: () => {},
  isHighContrast: false,
  toggleLargeText: () => {},
  isLargeText: false,
  toggleReducedMotion: () => {},
  isReducedMotion: false,
})

export const useEnhancedTheme = () => useContext(EnhancedThemeContext)

export function EnhancedThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme()
  const [isHighContrast, setIsHighContrast] = useState(false)
  const [isLargeText, setIsLargeText] = useState(false)
  const [isReducedMotion, setIsReducedMotion] = useState(false)
  const [mounted, setMounted] = useState(false)

  // After mounting, we have access to the theme
  useEffect(() => {
    setMounted(true)

    // Check for saved preferences
    const savedHighContrast = localStorage.getItem("highContrast") === "true"
    const savedLargeText = localStorage.getItem("largeText") === "true"
    const savedReducedMotion = localStorage.getItem("reducedMotion") === "true"

    setIsHighContrast(savedHighContrast)
    setIsLargeText(savedLargeText)
    setIsReducedMotion(savedReducedMotion)

    // Apply preferences
    if (savedHighContrast) document.documentElement.classList.add("high-contrast")
    if (savedLargeText) document.documentElement.classList.add("large-text")
    if (savedReducedMotion) document.documentElement.classList.add("reduced-motion")
  }, [])

  const toggleHighContrast = () => {
    const newValue = !isHighContrast
    setIsHighContrast(newValue)
    localStorage.setItem("highContrast", String(newValue))

    if (newValue) {
      document.documentElement.classList.add("high-contrast")
    } else {
      document.documentElement.classList.remove("high-contrast")
    }
  }

  const toggleLargeText = () => {
    const newValue = !isLargeText
    setIsLargeText(newValue)
    localStorage.setItem("largeText", String(newValue))

    if (newValue) {
      document.documentElement.classList.add("large-text")
    } else {
      document.documentElement.classList.remove("large-text")
    }
  }

  const toggleReducedMotion = () => {
    const newValue = !isReducedMotion
    setIsReducedMotion(newValue)
    localStorage.setItem("reducedMotion", String(newValue))

    if (newValue) {
      document.documentElement.classList.add("reduced-motion")
    } else {
      document.documentElement.classList.remove("reduced-motion")
    }
  }

  const value = {
    currentTheme: theme || "light",
    toggleHighContrast,
    isHighContrast,
    toggleLargeText,
    isLargeText,
    toggleReducedMotion,
    isReducedMotion,
  }

  if (!mounted) {
    return <>{children}</>
  }

  return <EnhancedThemeContext.Provider value={value}>{children}</EnhancedThemeContext.Provider>
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // After mounting, we have access to the theme
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return a placeholder with the same dimensions to prevent layout shift
    return <div className="w-9 h-9" />
  }

  const isDark = theme === "dark"
  const toggleTheme = () => setTheme(isDark ? "light" : "dark")

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
      <span className="sr-only">{isDark ? "Light mode" : "Dark mode"}</span>
    </Button>
  )
}
