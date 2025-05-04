"use client"

import { useAuth } from "@/context/auth-context"
import { WellnessMetricsProvider } from "@/context/wellness-metrics-context"
import { WellnessDashboard } from "@/components/dashboard/wellness-dashboard"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function WellnessDashboardClient() {
  const { user, isLoading, error } = useAuth()
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      setAuthChecked(true)
      if (!user) {
        // Store the intended destination for post-login redirect
        sessionStorage.setItem("redirectAfterLogin", "/dashboard")
        router.push("/auth/sign-in?redirect=/dashboard")
      }
    }
  }, [user, isLoading, router])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="text-center space-y-4">
          <div className="animate-pulse h-8 w-64 bg-muted rounded mx-auto"></div>
          <p className="text-muted-foreground">Verifying your credentials...</p>
        </div>
      </div>
    )
  }

  // Show error state if authentication fails
  if (error && authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>{error.message || "There was a problem verifying your account."}</AlertDescription>
          </Alert>
          <Button onClick={() => router.push("/auth/sign-in")} className="w-full" aria-label="Return to sign in page">
            Return to Sign In
          </Button>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated - will redirect in useEffect
  if (!user && authChecked) {
    return null
  }

  // Render dashboard with all required providers
  return (
    <WellnessMetricsProvider>
      <WellnessDashboard />
    </WellnessMetricsProvider>
  )
}
