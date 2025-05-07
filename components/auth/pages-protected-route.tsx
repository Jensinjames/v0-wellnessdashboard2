"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { getClientSession } from "@/lib/pages-auth"

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export default function PagesProtectedRoute({ children, redirectTo = "/auth/sign-in" }: ProtectedRouteProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getClientSession()

        if (!session) {
          router.push(redirectTo)
          return
        }

        setIsAuthenticated(true)
      } catch (error) {
        console.error("Auth check error:", error)
        router.push(redirectTo)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, redirectTo])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
