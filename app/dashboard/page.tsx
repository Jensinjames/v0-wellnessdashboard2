import { Suspense } from "react"

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}

// Use a server component to load the client component
function DashboardContent() {
  // This is a server component that dynamically imports the client component
  return <DashboardClientContent />
}

// Import the client component directly
import { DashboardClientContent } from "@/components/dashboard/dashboard-client-content"

// Skeleton loader for the dashboard
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-16 border-b bg-background"></div>
      <main className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </main>
    </div>
  )
}
