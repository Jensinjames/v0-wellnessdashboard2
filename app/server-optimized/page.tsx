import { Suspense } from "react"
import { DashboardStats } from "@/components/server/dashboard-stats"
import { CategoryCard } from "@/components/server/category-card"
import { createServerSupabaseClient } from "@/lib/supabase-server"

// This is a Server Component
export default async function ServerOptimizedPage() {
  // Fetch data on the server
  const supabase = await createServerSupabaseClient()

  // Get user session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    // Handle unauthenticated state
    return (
      <div className="container py-6">
        <h1 className="text-3xl font-bold mb-6">Server-Optimized Dashboard</h1>
        <p>Please sign in to view your dashboard.</p>
      </div>
    )
  }

  // Fetch dashboard data
  const { data: dashboardData, error } = await supabase
    .from("dashboard_stats")
    .select("*")
    .eq("user_id", session.user.id)
    .single()

  if (error) {
    // Handle error state
    return (
      <div className="container py-6">
        <h1 className="text-3xl font-bold mb-6">Server-Optimized Dashboard</h1>
        <p className="text-red-500">Error loading dashboard data: {error.message}</p>
      </div>
    )
  }

  // Fetch categories
  const { data: categories } = await supabase.from("categories").select("*").eq("user_id", session.user.id)

  // Transform data for our components
  const stats = {
    totalEntries: dashboardData?.total_entries || 0,
    totalHours: dashboardData?.total_hours || 0,
    categoriesCount: categories?.length || 0,
    completionRate: dashboardData?.completion_rate || 0,
  }

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Server-Optimized Dashboard</h1>
      <p className="text-muted-foreground mb-6">This dashboard is optimized using React Server Components.</p>

      <div className="space-y-6">
        <Suspense fallback={<div>Loading stats...</div>}>
          <DashboardStats stats={stats} />
        </Suspense>

        <h2 className="text-2xl font-bold mt-8 mb-4">Categories</h2>

        <Suspense fallback={<div>Loading categories...</div>}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories?.map((category) => (
              <CategoryCard
                key={category.id}
                category={category.name}
                value={category.current_hours || 0}
                max={category.target_hours || 10}
                color={category.color}
              />
            ))}
          </div>
        </Suspense>
      </div>
    </div>
  )
}
