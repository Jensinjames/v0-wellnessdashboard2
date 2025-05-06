"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Info } from "lucide-react"
import { WellnessDashboard } from "./wellness-dashboard"

export function DashboardContent() {
  const { user, profile, isLoading } = useAuth()
  const [isClient, setIsClient] = useState(false)
  const [networkError, setNetworkError] = useState(false)
  const [rateLimited, setRateLimited] = useState(false)
  const [demoMode, setDemoMode] = useState(false)

  // Handle hydration mismatch
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Check for network errors
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Try to fetch the Supabase URL to check connectivity
        const response = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL || "", {
          method: "HEAD",
          mode: "no-cors", // This prevents CORS errors
        })
        setNetworkError(false)
      } catch (error) {
        console.error("Network connectivity issue:", error)
        setNetworkError(true)
      }
    }

    if (isClient) {
      checkConnection()
    }
  }, [isClient])

  // Check for demo mode
  useEffect(() => {
    if (user && user.id.startsWith("mock-")) {
      setDemoMode(true)
    }
  }, [user])

  // Check for rate limiting errors
  useEffect(() => {
    // If we're using a mock profile due to rate limiting, show a message
    if (profile && !profile.first_name && !profile.last_name) {
      // This is a heuristic - if we have a profile with no name, it might be a mock
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.has("error") && urlParams.get("error") === "rate_limited") {
        setRateLimited(true)
      }
    }
  }, [profile])

  if (!isClient) {
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <>
      {networkError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Network Error</AlertTitle>
          <AlertDescription>Unable to connect to the database. You're viewing data in offline mode.</AlertDescription>
        </Alert>
      )}

      {rateLimited && (
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Rate Limiting</AlertTitle>
          <AlertDescription>
            You've reached the API rate limit. Some data may not be up to date. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      {demoMode && (
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Demo Mode</AlertTitle>
          <AlertDescription>
            You're using the application in demo mode due to database connectivity issues. Your data is stored locally
            and will not persist between sessions.
          </AlertDescription>
        </Alert>
      )}

      <WellnessDashboard />
    </>
  )
}
