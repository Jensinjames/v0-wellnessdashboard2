"use client"

import { useState, useEffect } from "react"
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
import { LoadingProvider } from "@/context/loading-context"
import { LoadingErrorBoundary } from "@/components/loading-error-boundary"
import { LoadingDashboard } from "@/components/ui/loading/loading-dashboard"
import type { WellnessEntryData } from "@/types/wellness"
import { Button } from "@/components/ui/button"
import { BarChart3, Grid2X2 } from "lucide-react"
import { useLoading } from "@/context/loading-context"

function DashboardContent() {
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false)
  const [entryToEdit, setEntryToEdit] = useState<WellnessEntryData | null>(null)
  const [comparisonMode, setComparisonMode] = useState(false)
  const { isLoading } = useLoading()
  const loading = isLoading("dashboard-initial")

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      // In a real app, this would be handled by actual data loading
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

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

  // Toggle comparison mode
  const toggleComparisonMode = () => {
    setComparisonMode(!comparisonMode)
  }

  if (loading) {
    return <LoadingDashboard />
  }

  return (
    <div className="dashboard-component min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <DashboardHeader onAddEntry={handleAddNewEntry} />

          <div className="grid gap-6">
            <LoadingErrorBoundary loadingKey="daily-metrics">
              <section className="dashboard-component">
                <h2 className="mb-3 text-sm font-medium">Daily Overview</h2>
                <DailyMetrics />
              </section>
            </LoadingErrorBoundary>

            <LoadingErrorBoundary loadingKey="category-performance">
              <section className="dashboard-component">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-medium">Category Performance</h2>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground mr-2">
                      {comparisonMode ? "Comparison Mode" : "Daily Progress"}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1"
                      onClick={toggleComparisonMode}
                      aria-pressed={comparisonMode}
                      aria-label={comparisonMode ? "Switch to standard view" : "Switch to comparison view"}
                    >
                      {comparisonMode ? (
                        <>
                          <Grid2X2 className="h-4 w-4" />
                          <span className="hidden sm:inline">Standard View</span>
                        </>
                      ) : (
                        <>
                          <BarChart3 className="h-4 w-4" />
                          <span className="hidden sm:inline">Compare Categories</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <CategoryOverview
                  showGoals={true}
                  showTimeAllocations={true}
                  showSubcategoryProgress={true}
                  interactive={!comparisonMode}
                  maxCategories={7}
                  comparisonMode={comparisonMode}
                />
              </section>
            </LoadingErrorBoundary>

            <LoadingErrorBoundary loadingKey="active-tracking">
              <section className="dashboard-component">
                <ActiveTracking />
              </section>
            </LoadingErrorBoundary>

            <LoadingErrorBoundary loadingKey="category-details">
              <section className="dashboard-component">
                <h2 className="mb-3 text-sm font-medium">Detailed Analysis</h2>
                <CategoryDetails />
              </section>
            </LoadingErrorBoundary>

            <LoadingErrorBoundary loadingKey="wellness-trends">
              <section className="dashboard-component">
                <h2 className="mb-3 text-sm font-medium">Wellness Trends</h2>
                <WellnessTrends />
              </section>
            </LoadingErrorBoundary>

            <LoadingErrorBoundary loadingKey="entries-list">
              <section className="dashboard-component">
                <EntriesList onEdit={handleEditEntry} />
              </section>
            </LoadingErrorBoundary>
          </div>
        </div>
      </div>

      <AddEntryForm open={isAddEntryOpen} onOpenChange={setIsAddEntryOpen} entryToEdit={entryToEdit} />
    </div>
  )
}

export default function Dashboard() {
  return (
    <WellnessProvider>
      <TrackingProvider>
        <LoadingProvider>
          <DashboardContent />
        </LoadingProvider>
      </TrackingProvider>
    </WellnessProvider>
  )
}
