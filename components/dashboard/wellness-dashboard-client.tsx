"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { WellnessDashboard } from "@/components/dashboard/wellness-dashboard"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Loader2, AlertTriangle } from "lucide-react"

export function WellnessDashboardClient() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const MAX_RETRIES = 3

  // Initialize authContext outside the try-catch to ensure it's always defined
  const authContext = useAuth()
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    if (!authContext) {
      setAuthError("Authentication system is not properly initialized.")
    }
  }, [authContext])

  if (authError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-destructive/10 p-6 rounded-lg max-w-md w-full mb-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-6 w-6 text-destructive mr-2" aria-hidden="true" />
            <h2 className="text-xl font-semibold">Authentication Error</h2>
          </div>
          <p className="mb-4">
            The authentication system is not properly initialized. Please try refreshing the page or contact support if
            the issue persists.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => window.location.reload()} aria-label="Refresh the page">
              Refresh Page
            </Button>
            <Button onClick={() => router.push("/")} aria-label="Return to the home page">
              Return Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const { user, isLoading, profile } = authContext

  useEffect(() => {
    // Only proceed after auth check is complete
    if (!isLoading) {
      setAuthChecked(true)

      if (!user) {
        // Store the intended destination for post-login redirect
        if (typeof window !== "undefined") {
          sessionStorage.setItem("redirectAfterLogin", "/dashboard")
        }

        // Redirect to sign-in page
        router.push("/auth/sign-in")
      } else if (!profile && retryCount < MAX_RETRIES) {
        // If user is authenticated but profile is missing, retry profile fetch
        console.log(`Profile not found, retrying... (${retryCount + 1}/${MAX_RETRIES})`)
        setRetryCount((prev) => prev + 1)

        // Wait a moment before retrying
        const timer = setTimeout(() => {
          window.location.reload()
        }, 1000)

        return () => clearTimeout(timer)
      } else if (!profile && retryCount >= MAX_RETRIES) {
        // If we've tried multiple times and still no profile, show error
        setError("Unable to load your profile. Please try signing out and back in.")
        toast({
          title: "Profile Error",
          description: "We're having trouble loading your profile data.",
          variant: "destructive",
        })
      }
    }
  }, [isLoading, user, router, profile, retryCount])

  // Show loading state while checking authentication
  if (isLoading || !authChecked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" aria-hidden="true" />
        <h2 className="text-2xl font-semibold mb-2">Loading your dashboard</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Please wait while we prepare your wellness dashboard...
        </p>
      </div>
    )
  }

  // Show error state if there's a problem
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-destructive/10 p-6 rounded-lg max-w-md w-full mb-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-6 w-6 text-destructive mr-2" aria-hidden="true" />
            <h2 className="text-xl font-semibold">Dashboard Error</h2>
          </div>
          <p className="mb-4">{error}</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => window.location.reload()} aria-label="Retry loading the dashboard">
              Try Again
            </Button>
            <Button onClick={() => router.push("/")} aria-label="Return to the home page">
              Return Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // If user is authenticated and has a profile, show the dashboard
  return <WellnessDashboard />
}
