"use client"

import { type ReactNode, useState, useEffect } from "react"

interface AuthWrapperProps {
  children: ReactNode
  fallback?: ReactNode
}

export function AuthWrapper({ children, fallback = null }: AuthWrapperProps) {
  const [isAuthAvailable, setIsAuthAvailable] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Safe way to check if auth context is available
  useEffect(() => {
    try {
      // Try to access the auth context
      const authContext = document.querySelector('[data-auth-provider="true"]')
      setIsAuthAvailable(!!authContext)
    } catch (error) {
      console.error("Error checking auth availability:", error)
      setIsAuthAvailable(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!isAuthAvailable) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
