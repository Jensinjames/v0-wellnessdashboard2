import { LoadingCard } from "./loading-card"
import { LoadingSection } from "./loading-section"
import { Skeleton } from "./skeleton"

export function LoadingDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <Skeleton variant="text" className="h-6 w-48" />
          <Skeleton variant="text" className="h-4 w-64" />
        </div>
        <div className="flex space-x-2">
          <Skeleton variant="button" />
          <Skeleton variant="button" />
        </div>
      </div>

      {/* Daily Metrics */}
      <LoadingSection title lines={0} className="mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <LoadingCard lines={2} />
        <LoadingCard lines={2} />
        <LoadingCard lines={2} />
      </div>

      {/* Category Performance */}
      <LoadingSection title lines={0} className="mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <LoadingCard lines={4} />
        <LoadingCard lines={4} />
      </div>

      {/* Active Tracking */}
      <LoadingSection title lines={0} className="mb-6" />
      <LoadingCard lines={3} hasFooter className="mb-6" />

      {/* Detailed Analysis */}
      <LoadingSection title lines={0} className="mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <LoadingCard lines={5} />
        <LoadingCard lines={5} />
      </div>
    </div>
  )
}
