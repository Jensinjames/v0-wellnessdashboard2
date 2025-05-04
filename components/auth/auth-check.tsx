"use client"

import type React from "react"

import { useAuth } from "@/context/auth-context-fixed"
import { Loader2 } from "lucide-react"

interface AuthCheckProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  loadingFallback?: React.ReactNode
}

export function AuthCheck({ children, fallback, loadingFallback }: AuthCheckProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      loadingFallback || (
        <div className="flex justify-center items-center h-24">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )
    )
  }

  if (!user) {
    return fallback || null
  }

  return <>{children}</>
}
