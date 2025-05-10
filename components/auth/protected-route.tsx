"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { checkAuthentication, redirectToLogin } from "@/utils/auth-utils"

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, isLoading, refreshSession } = useAuth()
  const [isVerifying, setIsVerifying] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const verifyAuth = async () => {
      // If we already have a user in context, we're authenticated
      if (user) {
        setIsAuthenticated(true)
        setIsVerifying(false)
        return
      }

      // If we're still loading the auth state, wait
      if (isLoading) {
        return
      }

      try {
        // Double-check authentication with the server
        const { authenticated } = await checkAuthentication()

        if (authenticated) {
          // We're authenticated but don't have a user in context
          // Refresh the session to update the context
          await refreshSession()
          setIsAuthenticated(true)
        } else {
          // Not authenticated, redirect to login
          redirectToLogin(window.location.pathname)
        }
      } catch (error) {
        console.error("Error verifying authentication:", error)
        // On error, redirect to login
        redirectToLogin(window.location.pathname)
      } finally {
        setIsVerifying(false)
      }
    }

    verifyAuth()
  }, [user, isLoading, router, refreshSession])

  // Show loading state while verifying
  if (isVerifying || isLoading) {
    return fallback || <div>Loading...</div>
  }

  // If authenticated, render children
  return isAuthenticated ? <>{children}</> : null
}
