import { TelemetryDashboard } from "@/components/debug/telemetry-dashboard"

export default function OptimizationDebugPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Optimization Debug</h1>
      <TelemetryDashboard />
    </div>
  )
}
