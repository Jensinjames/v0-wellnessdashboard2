"use client"

import { useState } from "react"
import { DailyMetrics } from "@/components/daily-metrics"
import { CategoryOverview } from "@/components/category-overview"
import { CategoryDetails } from "@/components/category-details"
import { AddEntryForm } from "@/components/add-entry-form"
import { EntriesList } from "@/components/entries-list"
import { DashboardHeader } from "@/components/dashboard-header"
import { WellnessTrends } from "@/components/wellness-trends"
import { ActiveTracking } from "@/components/active-tracking"
import { WellnessProvider } from "@/context/wellness-context"
import { TrackingProvider } from "@/context/tracking-context"
import type { WellnessEntryData } from "@/types/wellness"

export default function Dashboard() {
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false)
  const [entryToEdit, setEntryToEdit] = useState<WellnessEntryData | null>(null)

  // Open the form for a new entry
  const handleAddNewEntry = () => {
    setEntryToEdit(null)
    setIsAddEntryOpen(true)
  }

  // Handle editing an entry
  const handleEditEntry = (entry: WellnessEntryData) => {
    setEntryToEdit(entry)
    setIsAddEntryOpen(true)
  }

  return (
    <WellnessProvider>
      <TrackingProvider>
        <div className="min-h-screen bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="space-y-6">
              <DashboardHeader onAddEntry={handleAddNewEntry} />

              <div className="grid gap-6">
                <section>
                  <h2 className="mb-3 text-sm font-medium">Daily Overview</h2>
                  <DailyMetrics />
                </section>

                <section>
                  <h2 className="mb-3 text-sm font-medium">Category Performance</h2>
                  <CategoryOverview />
                </section>

                <section>
                  <ActiveTracking />
                </section>

                <section>
                  <h2 className="mb-3 text-sm font-medium">Detailed Analysis</h2>
                  <CategoryDetails />
                </section>

                <section>
                  <h2 className="mb-3 text-sm font-medium">Wellness Trends</h2>
                  <WellnessTrends />
                </section>

                <section>
                  <EntriesList onEdit={handleEditEntry} />
                </section>
              </div>
            </div>
          </div>

          <AddEntryForm open={isAddEntryOpen} onOpenChange={setIsAddEntryOpen} entryToEdit={entryToEdit} />
        </div>
      </TrackingProvider>
    </WellnessProvider>
  )
}
