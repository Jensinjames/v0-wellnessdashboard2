"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export function DashboardContent() {
  const { user, profile, isLoading } = useAuth()
  const [isClient, setIsClient] = useState(false)
  const [networkError, setNetworkError] = useState(false)

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

  if (!isClient) {
    return null
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Dashboard</CardTitle>
          <CardDescription>Please wait while we load your data</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-6">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </CardContent>
      </Card>
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

      <Card>
        <CardHeader>
          <CardTitle>Welcome to your Wellness Dashboard</CardTitle>
          <CardDescription>
            {profile?.first_name
              ? `Hello, ${profile.first_name}! You are signed in as ${user?.email}`
              : `You are signed in as ${user?.email || "Guest"}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Faith</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0%</div>
                <p className="text-xs text-muted-foreground">Goal: 10 hours</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Life</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0%</div>
                <p className="text-xs text-muted-foreground">Goal: 20 hours</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Work</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0%</div>
                <p className="text-xs text-muted-foreground">Goal: 40 hours</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0%</div>
                <p className="text-xs text-muted-foreground">Goal: 14 hours</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
