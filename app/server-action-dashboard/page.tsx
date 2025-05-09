import { Suspense } from "react"
import { ServerActionDashboard } from "@/components/dashboard/server-action-dashboard"
import { LoadingAnimation } from "@/components/ui/loading-animation"

export default function ServerActionDashboardPage() {
  return (
    <div className="container mx-auto py-8">
      <Suspense fallback={<LoadingAnimation />}>
        <ServerActionDashboard />
      </Suspense>
    </div>
  )
}
