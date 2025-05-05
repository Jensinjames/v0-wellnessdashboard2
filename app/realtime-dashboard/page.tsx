import { RealtimeWellnessProvider } from "@/context/realtime-wellness-context"
import { RealtimeWellnessDashboard } from "@/components/realtime-wellness-dashboard"

export default function RealtimeDashboardPage() {
  return (
    <RealtimeWellnessProvider>
      <div className="container py-10">
        <RealtimeWellnessDashboard />
      </div>
    </RealtimeWellnessProvider>
  )
}
