import { getSupabaseClient } from "@/lib/supabase-client"
import { redirect } from "next/navigation"
import { WellnessDistributionChart } from "@/components/wellness-distribution-chart"
import { CategoryProgressCard } from "@/components/category-progress-card"
import { DailyMetricsCard } from "@/components/daily-metrics-card"
import { TrackingHistoryCard } from "@/components/tracking-history-card"
import { ActivityLogForm } from "@/components/activity-log-form"
import { getWellnessData, createDefaultCategories } from "@/actions/wellness-actions"
import { calculateDailySummary } from "@/utils/wellness-utils"

// Mark this as a server component
export const dynamic = "force-dynamic"

export default async function Dashboard() {
  const supabase = getSupabaseClient()

  // Get the current session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/auth/signin")
  }

  const userId = session.user.id

  // Create default categories if needed (server action)
  await createDefaultCategories(userId)

  // Get wellness data (server action)
  const { categories, entries, goals, metrics, recentEntries, success, error } = await getWellnessData(userId)

  // Calculate daily summary
  const dailySummary = calculateDailySummary(categories, entries, goals)

  return (
    <div className="container mx-auto p-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Wellness Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-2">
          <WellnessDistributionChart
            data={dailySummary.categories}
            totalMinutesSpent={dailySummary.totalMinutesSpent}
            totalTargetMinutes={dailySummary.totalTargetMinutes}
            percentComplete={dailySummary.percentComplete}
          />
        </div>

        <div className="space-y-6">
          <DailyMetricsCard userId={userId} metrics={metrics} />
          <ActivityLogForm userId={userId} categories={categories} />
        </div>

        <div className="md:col-span-2 lg:col-span-3">
          <h2 className="mb-4 text-xl font-semibold">Categories</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {dailySummary.categories.map((category) => (
              <CategoryProgressCard
                key={category.id}
                name={category.name}
                color={category.color}
                icon={category.icon || "activity"}
                minutesSpent={category.minutesSpent}
                targetMinutes={category.targetMinutes}
                percentComplete={category.percentComplete}
              />
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <TrackingHistoryCard entries={recentEntries} categories={categories} />
        </div>
      </div>
    </div>
  )
}
