"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"

/**
 * A hook that safely uses the auth context only on the client side
 * This prevents the "useAuth must be used within an AuthProvider" error during SSR
 */
export function useSafeAuth() {
  const [isClient, setIsClient] = useState(false)
  const auth = useAuth() // Call useAuth unconditionally

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Return a placeholder auth object when not on client
  if (!isClient) {
    return {
      user: null,
      isLoading: true,
      signIn: async () => ({ error: { message: "Auth not available" } }),
      signUp: async () => ({ error: { message: "Auth not available" } }),
      signOut: async () => ({ error: { message: "Auth not available" } }),
      resetPassword: async () => ({ error: { message: "Auth not available" } }),
      updatePassword: async () => ({ error: { message: "Auth not available" } }),
      isClient: false,
    }
  }

  // Return the actual auth context when on client
  return {
    ...auth,
    isClient: true,
  }
}
