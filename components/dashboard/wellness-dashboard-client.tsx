"use client"

import { useAuth } from "@/context/auth-context"
import { WellnessMetricsProvider } from "@/context/wellness-metrics-context"
import { WellnessDashboard } from "@/components/dashboard/wellness-dashboard"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function WellnessDashboardClient() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/sign-in?redirect=/dashboard")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return <div className="p-8 text-center">Loading authentication...</div>
  }

  if (!user) {
    return null // Will redirect in the useEffect
  }

  return (
    <WellnessMetricsProvider>
      <WellnessDashboard />
    </WellnessMetricsProvider>
  )
}
