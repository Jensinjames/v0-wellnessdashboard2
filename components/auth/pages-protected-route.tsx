"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { usePagesAuth } from "@/context/pages-auth-context"

interface PagesProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export default function PagesProtectedRoute({ children, redirectTo = "/auth/sign-in" }: PagesProtectedRouteProps) {
  const router = useRouter()
  const { user, isLoading } = usePagesAuth()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push(redirectTo)
      } else {
        setIsReady(true)
      }
    }
  }, [user, isLoading, router, redirectTo])

  if (isLoading || !isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    )
  }

  return <>{children}</>
}
