import { PerformanceMonitor } from "@/components/debug/performance-monitor"

export default function PerformancePage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Performance Monitoring</h1>
      <PerformanceMonitor />
    </div>
  )
}
