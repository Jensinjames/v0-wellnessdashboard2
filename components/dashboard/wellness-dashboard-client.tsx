"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context-fixed"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

// Import other components as needed

export function WellnessDashboardClient() {
  const [isAuthProviderMissing, setIsAuthProviderMissing] = useState(false)
  const auth = useAuth()

  useEffect(() => {
    // Check if auth is undefined, which would indicate the component
    // is not wrapped in an AuthProvider
    if (!auth) {
      console.error("WellnessDashboardClient: AuthProvider is missing")
      setIsAuthProviderMissing(true)
    }
  }, [auth])

  if (isAuthProviderMissing) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>
            The authentication provider is missing. Please ensure the application is properly configured.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // If auth is not available, show a loading state or error
  if (!auth || !auth.user) {
    return (
      <Card className="p-4">
        <div className="text-center">
          <p>Please sign in to view your wellness dashboard.</p>
        </div>
      </Card>
    )
  }

  // Rest of your component that uses auth
  return (
    <div>
      <h1>Welcome, {auth.user.email}</h1>
      {/* Dashboard content */}
    </div>
  )
}
