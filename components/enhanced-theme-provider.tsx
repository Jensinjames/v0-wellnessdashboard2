"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: string
  storageKey?: string
}

type ThemeProviderState = {
  theme: string
  setTheme: (theme: string) => void
}

const initialState: ThemeProviderState = {
  theme: "light", // Changed default from "system" to "light"
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function EnhancedThemeProvider({
  children,
  defaultTheme = "light", // Changed default from "system" to "light"
  storageKey = "ui-theme",
  ...props
}: ThemeProviderProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Set the default theme to light on initial load
  useEffect(() => {
    if (!mounted) {
      setTheme(defaultTheme)
      setMounted(true)
    }
  }, [defaultTheme, mounted, setTheme])

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme || "light") // Fallback to light if theme is undefined
  }, [theme])

  const value = {
    theme: theme || "light", // Fallback to light if theme is undefined
    setTheme: (theme: string) => {
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useEnhancedTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) {
    throw new Error("useEnhancedTheme must be used within a ThemeProvider")
  }

  return context
}

export function ThemeToggle() {
  const { theme, setTheme } = useEnhancedTheme()
  const [mounted, setMounted] = useState(false)

  // Only show the toggle once the component has mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-10 h-10" /> // Placeholder with same dimensions
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
      className="rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" aria-hidden="true" />
      <Moon
        className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
        aria-hidden="true"
      />
      <span className="sr-only">{theme === "light" ? "Switch to dark theme" : "Switch to light theme"}</span>
    </Button>
  )
}
