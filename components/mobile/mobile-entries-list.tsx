"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Edit2, Trash2, Filter, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useWellness } from "@/context/wellness-context"
import type { WellnessEntryData } from "@/types/wellness"

interface MobileEntriesListProps {
  onEditEntry: (entry: WellnessEntryData) => void
}

export function MobileEntriesList({ onEditEntry }: MobileEntriesListProps) {
  const { entries, categories, removeEntry } = useWellness()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Sort entries by date (most recent first)
  const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Filter entries based on search term
  const filteredEntries = sortedEntries.filter((entry) => {
    const dateStr = format(new Date(entry.date), "MMM d, yyyy").toLowerCase()
    return dateStr.includes(searchTerm.toLowerCase())
  })

  // Function to confirm deletion
  const confirmDelete = (id: string) => {
    setEntryToDelete(id)
    setDeleteDialogOpen(true)
  }

  // Function to handle actual deletion
  const handleDelete = () => {
    if (entryToDelete) {
      removeEntry(entryToDelete)
      setDeleteDialogOpen(false)
      setEntryToDelete(null)
    }
  }

  // Function to get overall score
  const getOverallScore = (entry: WellnessEntryData): number => {
    const enabledCategories = categories.filter((c) => c.enabled)
    if (enabledCategories.length === 0) return 0

    let totalScore = 0
    let categoryCount = 0

    enabledCategories.forEach((category) => {
      const categoryMetrics = entry.metrics.filter((m) => m.categoryId === category.id)

      if (categoryMetrics.length > 0) {
        let score = 0
        categoryMetrics.forEach((metric) => {
          const metricDef = category.metrics.find((m) => m.id === metric.metricId)
          if (metricDef) {
            if (metricDef.id === "stressLevel") {
              // For stress level, lower is better
              score += ((metricDef.max - metric.value) / (metricDef.max - metricDef.min)) * 100
            } else {
              score += (metric.value / metricDef.max) * 100
            }
          }
        })

        totalScore += score / categoryMetrics.length
        categoryCount++
      }
    })

    return categoryCount > 0 ? Math.round(totalScore / categoryCount) : 0
  }

  // Function to get score badge color
  const getScoreBadgeColor = (score: number): string => {
    if (score >= 80) return "bg-gradient-to-r from-green-500 to-green-600"
    if (score >= 60) return "bg-gradient-to-r from-blue-500 to-blue-600"
    if (score >= 40) return "bg-gradient-to-r from-yellow-500 to-yellow-600"
    if (score >= 20) return "bg-gradient-to-r from-orange-500 to-orange-600"
    return "bg-gradient-to-r from-red-500 to-red-600"
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search entries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline" size="icon" className="h-10 w-10">
          <Filter className="h-4 w-4" />
          <span className="sr-only">Filter</span>
        </Button>
      </div>

      <div className="space-y-3">
        {filteredEntries.length > 0 ? (
          filteredEntries.map((entry) => {
            const overallScore = getOverallScore(entry)

            return (
              <Card key={entry.id} className="border shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{format(new Date(entry.date), "MMM d, yyyy")}</div>
                    <Badge className={`${getScoreBadgeColor(overallScore)} shadow-sm`}>{overallScore}%</Badge>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {entry.metrics.slice(0, 3).map((metric) => {
                      const category = categories.find((c) => c.id === metric.categoryId)
                      const metricDef = category?.metrics.find((m) => m.id === metric.metricId)

                      if (!category || !metricDef) return null

                      return (
                        <Badge key={`${metric.categoryId}-${metric.metricId}`} variant="outline" className="text-xs">
                          {metricDef.name}: {metric.value} {metricDef.unit}
                        </Badge>
                      )
                    })}
                    {entry.metrics.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{entry.metrics.length - 3} more
                      </Badge>
                    )}
                  </div>

                  <div className="mt-3 flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditEntry(entry)}
                      className="h-8 w-8 rounded-full p-0"
                    >
                      <Edit2 className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => confirmDelete(entry.id)}
                      className="h-8 w-8 rounded-full p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-6 w-6 text-muted-foreground"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium">No entries found</h3>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              {searchTerm ? "Try adjusting your search term." : "Add your first wellness entry to get started."}
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
