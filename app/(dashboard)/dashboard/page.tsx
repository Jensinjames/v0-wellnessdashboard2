import type { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard-header"
import { DailyMetrics } from "@/components/daily-metrics"
import { ActivityScoreChart } from "@/components/activity-score-chart"
import { ActivityHistoryChart } from "@/components/activity-history-chart"
import { CategoryOverview } from "@/components/category-overview"

export const metadata: Metadata = {
  title: "Dashboard - Wellness Dashboard",
  description: "Your wellness metrics at a glance",
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <DashboardHeader title="Dashboard" description="Your wellness metrics at a glance" />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <DailyMetrics />
        <ActivityScoreChart />
        <ActivityHistoryChart />
      </div>

      <CategoryOverview />
    </div>
  )
}
