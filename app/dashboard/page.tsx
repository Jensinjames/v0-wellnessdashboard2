// Prevent static prerendering
export const dynamic = "force-dynamic"

import { Suspense } from "react"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"
import { WellnessDashboardClient } from "@/components/dashboard/wellness-dashboard-client"

export default function DashboardPage() {
  return (
    <main className="container mx-auto py-6 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-6">Wellness Dashboard</h1>
      <Suspense fallback={<DashboardSkeleton />}>
        <WellnessDashboardClient />
      </Suspense>
    </main>
  )
}
