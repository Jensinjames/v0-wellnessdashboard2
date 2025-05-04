"use client"

import { useEffect, useState } from "react"
import { WellnessDashboardClient } from "@/components/dashboard/wellness-dashboard-client"
import { Loader2 } from "lucide-react"

// This component handles the client-side loading of the dashboard
// It acts as a boundary between server and client components
export function WellnessDashboardClientLoader() {
  const [isClient, setIsClient] = useState(false)

  // Use an effect to confirm we're on the client
  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" aria-hidden="true" />
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    )
  }

  return <WellnessDashboardClient />
}
