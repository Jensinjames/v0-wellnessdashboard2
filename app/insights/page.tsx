import { Suspense } from "react"
import { WeeklyWellnessSummary } from "@/components/dashboard/weekly-wellness-summary"
import { CategoryInsights } from "@/components/category-overview/category-insights"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
  title: "Wellness Insights | Dashboard",
  description: "AI-powered insights for your wellness journey",
}

export default function InsightsPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <h1 className="text-3xl font-bold">Wellness Insights</h1>

      <div className="grid grid-cols-1 gap-6">
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <WeeklyWellnessSummary />
        </Suspense>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <CategoryInsights category="exercise" />
          </Suspense>

          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <CategoryInsights category="meditation" />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
