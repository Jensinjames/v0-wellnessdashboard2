import { LightModeLayout } from "@/components/layout/light-mode-layout"
import { LightModeDashboard } from "@/components/dashboard/light-mode-dashboard"

export default function DashboardPage() {
  return (
    <LightModeLayout>
      <LightModeDashboard />
    </LightModeLayout>
  )
}
