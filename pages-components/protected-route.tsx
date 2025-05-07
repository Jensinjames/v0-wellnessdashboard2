"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { useAuth } from "../pages-lib/auth-context"

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export default function ProtectedRoute({ children, redirectTo = "/auth/sign-in" }: ProtectedRouteProps) {
  const router = useRouter()
  const auth = useAuth()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!auth.isLoading) {
      if (!auth.user) {
        router.push(redirectTo)
      } else {
        setIsReady(true)
      }
    }
  }, [auth.user, auth.isLoading, router, redirectTo])

  if (auth.isLoading || !isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    )
  }

  return <>{children}</>
}
