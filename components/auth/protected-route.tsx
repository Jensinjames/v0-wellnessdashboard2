"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useEnhancedAuth } from "@/hooks/auth"

interface ProtectedRouteProps {
  children: ReactNode
  redirectTo?: string
  fallback?: ReactNode
}

export function ProtectedRoute({ children, redirectTo = "/auth/login", fallback }: ProtectedRouteProps) {
  const { isLoading, isAuthenticated, requireAuth } = useEnhancedAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      requireAuth(redirectTo)
    }
  }, [isLoading, requireAuth, redirectTo, router])

  if (isLoading) {
    return fallback || <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
