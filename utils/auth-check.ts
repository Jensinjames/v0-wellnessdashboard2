"use client"

import { useEffect, useState } from "react"

export function useAuthCheck() {
  const [isAuthAvailable, setIsAuthAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    try {
      // Check if auth context is available by looking for the provider in the DOM
      const authProviderExists = document.querySelector('[data-auth-provider="true"]')
      setIsAuthAvailable(!!authProviderExists)
    } catch (error) {
      console.error("Error checking auth availability:", error)
      setIsAuthAvailable(false)
    }
  }, [])

  return isAuthAvailable
}
