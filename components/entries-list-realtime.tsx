"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Filter, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useWellness } from "@/context/wellness-context"
import { EnhancedEntriesTable } from "@/components/enhanced-entries-table"
import { RealtimeStatus } from "@/components/ui/realtime-status"
import { useRealtimeEntries, type EntryFilter } from "@/hooks/use-realtime-entries"
import { getCurrentUser } from "@/lib/supabase"
import type { WellnessEntryData, CategoryId } from "@/types/wellness"
import type { Database } from "@/types/database"
import { createBrowserClient } from "@supabase/ssr"

type Entry = Database["public"]["Tables"]["entries"]["Row"]

interface EntriesListRealtimeProps {
  onEdit: (entry: WellnessEntryData) => void
}

export function EntriesListRealtime({ onEdit }: EntriesListRealtimeProps) {
  const { categories } = useWellness()
  const [userId, setUserId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("recent")
  const [searchTerm, setSearchTerm] = useState("")

  // Get current user
  useEffect(() => {
    async function fetchUser() {
      const user = await getCurrentUser()
      setUserId(user?.id || null)
    }

    fetchUser()
  }, [])

  // Set up filter for this week
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay()) // Start of current week (Sunday)

  const thisWeekFilter: EntryFilter = {
    startDate: startOfWeek.toISOString().split("T")[0],
    endDate: today.toISOString().split("T")[0],
  }

  // Get entries with real-time updates
  const [allEntries, allEntriesLoading, allEntriesError] = useRealtimeEntries(
    userId || "",
    userId ? undefined : undefined, // Only fetch if we have a userId
  )

  const [thisWeekEntries, thisWeekEntriesLoading, thisWeekEntriesError] = useRealtimeEntries(
    userId || "",
    userId ? thisWeekFilter : undefined, // Only fetch if we have a userId
  )

  // Filter entries based on search term
  const filteredEntries = allEntries.filter((entry) => {
    const dateStr = format(new Date(entry.date), "MMM d, yyyy").toLowerCase()
    return dateStr.includes(searchTerm.toLowerCase())
  })

  const filteredWeekEntries = thisWeekEntries.filter((entry) => {
    const dateStr = format(new Date(entry.date), "MMM d, yyyy").toLowerCase()
    return dateStr.includes(searchTerm.toLowerCase())
  })

  // Function to confirm deletion
  const confirmDelete = (id: string) => {
    setEntryToDelete(id)
    setDeleteDialogOpen(true)
  }

  // Function to handle actual deletion
  const handleDelete = async () => {
    if (entryToDelete) {
      try {
        const supabase = createBrowserClient()
        const { error } = await supabase.from("entries").delete().eq("id", entryToDelete)

        if (error) throw error

        setDeleteDialogOpen(false)
        setEntryToDelete(null)
      } catch (error) {
        console.error("Error deleting entry:", error)
      }
    }
  }

  // Function to get category score
  const getCategoryScore = (entry: Entry, categoryId: CategoryId): number => {
    const category = categories.find((c) => c.id === categoryId)
    if (!category) return 0

    // Calculate score based on the metrics in this category
    // This is a simplified version - you would need to adapt this to your actual data model
    return Math.min(100, Math.round((entry.duration / 60) * 100))
  }

  // Function to get overall score
  const getOverallScore = (entry: Entry): number => {
    return Math.min(100, Math.round((entry.duration / 60) * 100))
  }

  // Function to get score badge color
  const getScoreBadgeColor = (score: number): string => {
    if (score >= 80) return "bg-gradient-to-r from-green-500 to-green-600"
    if (score >= 60) return "bg-gradient-to-r from-blue-500 to-blue-600"
    if (score >= 40) return "bg-gradient-to-r from-yellow-500 to-yellow-600"
    if (score >= 20) return "bg-gradient-to-r from-orange-500 to-orange-600"
    return "bg-gradient-to-r from-red-500 to-red-600"
  }

  // Get category color class
  const getCategoryColorClass = (categoryId: CategoryId): string => {
    const category = categories.find((c) => c.id === categoryId)
    return category
      ? `bg-${category.color}-50 text-${category.color}-700 hover:bg-${category.color}-100 border-${category.color}-200`
      : ""
  }

  // Convert database entries to WellnessEntryData format for the edit function
  const convertToWellnessEntry = (entry: Entry): WellnessEntryData => {
    return {
      id: entry.id,
      date: new Date(entry.date),
      metrics: [
        {
          categoryId: entry.category_id,
          metricId: "duration", // Assuming a default metric ID
          value: entry.duration,
        },
      ],
    }
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div>
              <CardTitle>Your Entries</CardTitle>
              <CardDescription>View and manage your wellness entries</CardDescription>
            </div>
            {userId && <RealtimeStatus isConnected={!allEntriesError && !thisWeekEntriesError} className="ml-2" />}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Input
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 w-[200px] pl-8"
                aria-label="Search entries by date"
                id="entries-search"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1"
              id="filter-button"
              aria-label="Filter entries by criteria"
            >
              <Filter className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Filter</span>
              <span className="sr-only sm:hidden">Filter entries</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1"
              id="sort-button"
              aria-label="Sort entries by date or score"
            >
              <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Sort</span>
              <span className="sr-only sm:hidden">Sort entries</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b px-6">
            <TabsList className="w-full justify-start rounded-none border-b-0 p-0">
              <TabsTrigger
                value="recent"
                className="relative rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                id="tab-recent"
              >
                All Entries
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                  {filteredEntries.length}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="thisWeek"
                className="relative rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                id="tab-thisWeek"
              >
                This Week
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                  {filteredWeekEntries.length}
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="recent" className="m-0" id="panel-recent">
            <div
              className="entries-container"
              aria-live="polite"
              aria-atomic="false"
              aria-relevant="additions removals"
            >
              {allEntriesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-pulse text-center">
                    <div className="h-6 w-32 bg-gray-200 rounded mx-auto mb-2"></div>
                    <div className="h-4 w-48 bg-gray-200 rounded mx-auto"></div>
                  </div>
                </div>
              ) : filteredEntries.length > 0 ? (
                <EnhancedEntriesTable
                  entries={filteredEntries.map(convertToWellnessEntry)}
                  onEdit={(entry) => onEdit(entry)}
                  onDelete={confirmDelete}
                  getCategoryScore={getCategoryScore}
                  getOverallScore={getOverallScore}
                  getScoreBadgeColor={getScoreBadgeColor}
                  getCategoryColorClass={getCategoryColorClass}
                  searchTerm={searchTerm}
                  categories={categories}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12" role="status" aria-live="polite">
                  <div className="rounded-full bg-muted p-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-6 w-6 text-muted-foreground"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-medium">No entries found</h3>
                  <p className="mt-1 text-center text-sm text-muted-foreground">
                    {searchTerm
                      ? "Try adjusting your search term or add a new entry."
                      : "Add your first wellness entry to start tracking your progress."}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="thisWeek" className="m-0" id="panel-thisWeek">
            <div
              className="entries-container"
              aria-live="polite"
              aria-atomic="false"
              aria-relevant="additions removals"
            >
              {thisWeekEntriesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-pulse text-center">
                    <div className="h-6 w-32 bg-gray-200 rounded mx-auto mb-2"></div>
                    <div className="h-4 w-48 bg-gray-200 rounded mx-auto"></div>
                  </div>
                </div>
              ) : filteredWeekEntries.length > 0 ? (
                <EnhancedEntriesTable
                  entries={filteredWeekEntries.map(convertToWellnessEntry)}
                  onEdit={(entry) => onEdit(entry)}
                  onDelete={confirmDelete}
                  getCategoryScore={getCategoryScore}
                  getOverallScore={getOverallScore}
                  getScoreBadgeColor={getScoreBadgeColor}
                  getCategoryColorClass={getCategoryColorClass}
                  searchTerm={searchTerm}
                  categories={categories}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12" role="status" aria-live="polite">
                  <div className="rounded-full bg-muted p-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-6 w-6 text-muted-foreground"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-medium">No entries for this week</h3>
                  <p className="mt-1 text-center text-sm text-muted-foreground">
                    {searchTerm
                      ? "Try adjusting your search term or add a new entry for this week."
                      : "Add your first wellness entry for this week to start tracking your progress."}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              id="cancel-delete-button"
              aria-label="Cancel deletion and close dialog"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              id="confirm-delete-button"
              aria-label="Confirm deletion of this entry"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
