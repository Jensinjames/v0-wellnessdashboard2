"use client"

import { useAuth } from "@/context/auth-context"
import { useEffect } from "react"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const { user, isLoading } = useAuth()

  useEffect(() => {
    // If authentication is complete and user is logged in, redirect to dashboard
    if (!isLoading && user) {
      redirect("/dashboard")
    }

    // If authentication is complete and user is not logged in, redirect to sign-in
    if (!isLoading && !user) {
      redirect("/auth/sign-in?redirect=/dashboard")
    }
  }, [user, isLoading])

  // Show loading state while checking authentication
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-3xl font-bold">Welcome to Wellness Dashboard</h1>
        <p className="text-muted-foreground">
          Track and visualize your wellness journey with our comprehensive dashboard.
        </p>
        <div className="flex justify-center">
          <Button disabled className="mx-auto">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Preparing your dashboard</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
