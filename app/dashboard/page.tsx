"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Navigation } from "@/components/navigation"
import { WellnessDashboard } from "@/components/dashboard/wellness-dashboard"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Loading...</h1>
          </div>
        </main>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Dashboard</h1>
          </div>
          <div className="flex flex-col items-center justify-center py-12">
            <p className="mb-4">Please sign in to view your dashboard.</p>
            <Button onClick={() => router.push("/auth/sign-in")}>Sign In</Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex gap-2">
            <Button onClick={() => router.push("/goals")} variant="outline">
              Manage Goals
            </Button>
            <Button onClick={() => router.push("/categories")} variant="outline">
              Manage Categories
            </Button>
          </div>
        </div>

        <WellnessDashboard />
      </main>
    </div>
  )
}
