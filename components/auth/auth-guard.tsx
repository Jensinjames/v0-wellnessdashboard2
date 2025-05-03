"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/hooks/use-user"
import { useSession } from "@/hooks/use-supabase"
import { LoadingSection } from "@/components/ui/loading/loading-section"
import { toast } from "@/hooks/use-toast"
import { handleAuthError } from "@/lib/auth-error-handler"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading: userLoading, error: userError } = useUser()
  const { session, loading: sessionLoading, refreshSession } = useSession()
  const [isVerifying, setIsVerifying] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        // If still loading, wait
        if (userLoading || sessionLoading) {
          return
        }

        // If no session or user, try to refresh once before redirecting
        if (!session && !user && retryCount < 1) {
          setRetryCount((prev) => prev + 1)
          const result = await refreshSession()

          if (!result.success) {
            throw new Error("Auth session missing!")
          }

          return // Wait for session update to trigger this effect again
        }

        // If still no user after retry, redirect to login
        if (!user && !userLoading) {
          throw new Error("Auth session missing!")
        }

        // Auth verified successfully
        setIsVerifying(false)
      } catch (err) {
        const errorDetails = await handleAuthError(err)

        // Show error message
        toast({
          title: "Authentication Error",
          description: errorDetails.message,
          variant: "destructive",
        })

        // Redirect to login
        router.push("/login")
      }
    }

    verifyAuth()
  }, [user, session, userLoading, sessionLoading, router, refreshSession, retryCount])

  // Show loading while verifying auth
  if (isVerifying || userLoading || sessionLoading) {
    return <LoadingSection />
  }

  // Auth verified, render children
  return <>{children}</>
}
