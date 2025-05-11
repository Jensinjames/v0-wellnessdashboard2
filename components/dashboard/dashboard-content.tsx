"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Info, Wifi, WifiOff } from "lucide-react"
import { WellnessDashboard } from "./wellness-dashboard"
import { Button } from "@/components/ui/button"
import { VerificationReminder } from "@/components/profile/verification-reminder"

export function DashboardContent() {
  const { user, profile, isLoading } = useAuth()
  const [isClient, setIsClient] = useState(false)
  const [networkError, setNetworkError] = useState(false)
  const [networkStatus, setNetworkStatus] = useState<"online" | "offline">("online")
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
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const response = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL || "", {
          method: "HEAD",
          mode: "no-cors", // This prevents CORS errors
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
        setNetworkError(false)
      } catch (error) {
        console.error("Network connectivity issue:", error)
        setNetworkError(true)
      }
    }

    if (isClient) {
      checkConnection()
    }

    // Also listen for online/offline events
    const handleOnline = () => {
      setNetworkStatus("online")
      checkConnection() // Recheck connection when we go online
    }

    const handleOffline = () => {
      setNetworkStatus("offline")
      setNetworkError(true)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
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
      <VerificationReminder />
      {networkStatus === "offline" && (
        <Alert variant="destructive" className="mb-4">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>You're offline</AlertTitle>
          <AlertDescription>Your device is currently offline. Some features may be limited.</AlertDescription>
        </Alert>
      )}

      {networkError && networkStatus === "online" && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Network Error</AlertTitle>
          <AlertDescription>
            Unable to connect to the database. You're viewing data in offline mode.
            <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
              <Wifi className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </AlertDescription>
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
