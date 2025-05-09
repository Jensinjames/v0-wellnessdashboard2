"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"

// Define the shape of our navigation context
interface NavigationContextType {
  previousPath: string | null
  currentPath: string
  navigateBack: () => void
  canNavigateBack: boolean
}

// Create the context with default values
const NavigationContext = createContext<NavigationContextType>({
  previousPath: null,
  currentPath: "/",
  navigateBack: () => {},
  canNavigateBack: false,
})

// Hook to use the navigation context
export const useNavigationContext = () => useContext(NavigationContext)

interface NavigationProviderProps {
  children: React.ReactNode
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [previousPath, setPreviousPath] = useState<string | null>(null)
  const [currentPath, setCurrentPath] = useState<string>(pathname)

  // Update paths when navigation occurs
  useEffect(() => {
    if (pathname !== currentPath) {
      setPreviousPath(currentPath)
      setCurrentPath(pathname)
    }
  }, [pathname, currentPath])

  // Function to navigate back
  const navigateBack = () => {
    if (previousPath) {
      window.history.back()
    }
  }

  // Check if we can navigate back
  const canNavigateBack = Boolean(previousPath && previousPath !== pathname)

  return (
    <NavigationContext.Provider
      value={{
        previousPath,
        currentPath,
        navigateBack,
        canNavigateBack,
      }}
    >
      {children}
    </NavigationContext.Provider>
  )
}
