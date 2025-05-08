"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { usePathname, useSearchParams } from "next/navigation"

interface NavigationHistory {
  previousPaths: string[]
  currentPath: string | null
}

interface NavigationContextType {
  history: NavigationHistory
  addToHistory: (path: string) => void
  getPreviousPath: () => string | null
  clearHistory: () => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [history, setHistory] = useState<NavigationHistory>({
    previousPaths: [],
    currentPath: null,
  })

  // Update history when path changes
  useEffect(() => {
    if (!pathname) return

    setHistory((prev) => {
      // Don't add the same path twice in a row
      if (prev.currentPath === pathname) return prev

      // Add current path to history
      return {
        previousPaths: prev.currentPath ? [...prev.previousPaths, prev.currentPath] : [...prev.previousPaths],
        currentPath: pathname,
      }
    })
  }, [pathname, searchParams])

  // Add a path to history
  const addToHistory = (path: string) => {
    setHistory((prev) => ({
      previousPaths: prev.currentPath ? [...prev.previousPaths, prev.currentPath] : [...prev.previousPaths],
      currentPath: path,
    }))
  }

  // Get the previous path
  const getPreviousPath = (): string | null => {
    // First check for returnTo query param
    const returnTo = searchParams?.get("returnTo")
    if (returnTo) return returnTo

    // Then check history
    if (history.previousPaths.length > 0) {
      return history.previousPaths[history.previousPaths.length - 1]
    }

    // Default to dashboard
    return "/dashboard"
  }

  // Clear history
  const clearHistory = () => {
    setHistory({
      previousPaths: [],
      currentPath: pathname || null,
    })
  }

  return (
    <NavigationContext.Provider value={{ history, addToHistory, getPreviousPath, clearHistory }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigationContext() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error("useNavigationContext must be used within a NavigationProvider")
  }
  return context
}
