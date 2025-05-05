"use client"

import { DateRangePicker } from "@/components/date-range-picker"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface DashboardHeaderProps {
  onAddEntry: () => void
}

export function DashboardHeader({ onAddEntry }: DashboardHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-blue-600 p-4 text-white shadow-lg">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Wellness Dashboard</h1>
          <p className="mt-1 text-sm text-blue-100">Track, analyze, and improve your daily wellness metrics</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 sm:mt-0">
          <DateRangePicker className="bg-white/10 text-white hover:bg-white/20" />
          <Button asChild variant="outline" size="sm" className="bg-white/10 text-white hover:bg-white/20">
            <Link href="/categories">Manage Categories</Link>
          </Button>
          <Button onClick={onAddEntry} size="sm" className="bg-white text-blue-600 hover:bg-blue-50">
            Activity
          </Button>
        </div>
      </div>
    </div>
  )
}
