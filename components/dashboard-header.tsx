"use client"

import { DateRangePicker } from "@/components/date-range-picker"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useUniqueId } from "@/utils/unique-id"

interface DashboardHeaderProps {
  onAddEntry: () => void
}

export function DashboardHeader({ onAddEntry }: DashboardHeaderProps) {
  const headerId = useUniqueId("dashboard-header")
  const categoriesButtonId = useUniqueId("categories-button")
  const activityButtonId = useUniqueId("activity-button")

  return (
    <div className="relative overflow-hidden rounded-xl bg-blue-700 p-4 text-white shadow-lg">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 id={headerId} className="text-xl font-bold tracking-tight sm:text-2xl">
            Wellness Dashboard
          </h1>
          <p className="mt-1 text-sm text-white">Track, analyze, and improve your daily wellness metrics</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 sm:mt-0">
          <DateRangePicker className="bg-white/20 text-white hover:bg-white/30" />
          <Button
            asChild
            variant="outline"
            size="sm"
            className="bg-white/20 text-white hover:bg-white/30 border-white/30"
            aria-label="Go to categories management page"
            id={categoriesButtonId}
          >
            <Link href="/categories">Manage Categories</Link>
          </Button>
          <Button
            onClick={onAddEntry}
            size="sm"
            className="bg-white text-blue-700 hover:bg-blue-50"
            aria-label="Add new activity entry"
            id={activityButtonId}
          >
            Activity
          </Button>
        </div>
      </div>
    </div>
  )
}
