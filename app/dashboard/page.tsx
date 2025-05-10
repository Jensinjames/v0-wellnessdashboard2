import { Suspense } from "react"

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      {/* @ts-expect-error Async Server Component */}
      <DashboardClient />
    </Suspense>
  )
}

// Use a dynamic import to ensure the client component is properly isolated
async function DashboardClient() {
  const { DashboardContent } = await import("@/components/dashboard/dashboard-client")
  return <DashboardContent />
}

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
