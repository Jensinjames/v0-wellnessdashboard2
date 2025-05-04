import { WellnessDashboardClientLoader } from "@/components/dashboard/wellness-dashboard-client-loader"
import { generateServerSafeId } from "@/utils/server-safe-id"

export const dynamic = "force-dynamic"

export default function DashboardPage() {
  // Use server-safe IDs for any needed identifiers
  const dashboardId = generateServerSafeId("dashboard")

  return (
    <div id={dashboardId}>
      <WellnessDashboardClientLoader />
    </div>
  )
}
