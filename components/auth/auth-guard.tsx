"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context-ssr"

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
}

export function AuthGuard({ children, redirectTo = "/auth/sign-in" }: AuthGuardProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Only redirect after the initial loading is complete
    if (!isLoading && !user) {
      // Add the current path as a redirect parameter
      const redirectUrl = `${redirectTo}?redirectTo=${encodeURIComponent(pathname)}`
      router.push(redirectUrl)
    }
  }, [user, isLoading, router, pathname, redirectTo])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    )
  }

  // If authenticated, show the children
  if (user) {
    return <>{children}</>
  }

  // If not authenticated and not loading, show nothing (will redirect)
  return null
}
