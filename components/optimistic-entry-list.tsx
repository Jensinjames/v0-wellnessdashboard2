"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"
import { useWellness } from "@/context/wellness-context"
import { useEntryOptimistic } from "@/hooks/use-entry-optimistic"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { OptimisticEntryForm } from "@/components/optimistic-entry-form"
import type { WellnessEntry } from "@/schemas/wellness-schemas"

export function OptimisticEntryList() {
  const { entries, categories } = useWellness()
  const { isPendingEntry } = useEntryOptimistic()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<WellnessEntry | null>(null)
  const [sortedEntries, setSortedEntries] = useState<WellnessEntry[]>([])

  // Sort entries by date (newest first)
  useEffect(() => {
    const sorted = [...entries].sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateB - dateA
    })
    setSortedEntries(sorted)
  }, [entries])

  // Get category and metric names
  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    return category?.name || "Unknown Category"
  }

  const getMetricName = (categoryId: string, metricId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    const metric = category?.metrics.find((m) => m.id === metricId)
    return metric?.name || "Unknown Metric"
  }

  // Handle entry click to edit
  const handleEntryClick = (entry: WellnessEntry) => {
    setSelectedEntry(entry)
    setIsDialogOpen(true)
  }

  // Close dialog and reset selected entry
  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setSelectedEntry(null)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Recent Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedEntries.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No entries yet. Add your first entry!</p>
          ) : (
            <div className="space-y-3">
              {sortedEntries.map((entry) => {
                const isPending = isPendingEntry(entry.id)

                return (
                  <div
                    key={entry.id}
                    className={cn(
                      "p-3 border rounded-md cursor-pointer hover:bg-accent/50 transition-colors",
                      isPending && "opacity-70 bg-muted/50",
                    )}
                    onClick={() => handleEntryClick(entry)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium flex items-center">
                          {getCategoryName(entry.categoryId)} - {getMetricName(entry.categoryId, entry.metricId)}
                          {isPending && <Loader2 className="ml-2 h-3 w-3 animate-spin text-muted-foreground" />}
                        </div>
                        <div className="text-sm text-muted-foreground">{format(new Date(entry.date), "PPP")}</div>
                      </div>
                      <div className="text-lg font-semibold">{entry.value}</div>
                    </div>
                    {entry.notes && (
                      <div className="mt-2 text-sm text-muted-foreground line-clamp-2">{entry.notes}</div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Entry Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Entry</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <OptimisticEntryForm
              entryId={selectedEntry.id}
              defaultValues={{
                categoryId: selectedEntry.categoryId,
                metricId: selectedEntry.metricId,
                value: selectedEntry.value,
                date: new Date(selectedEntry.date),
                notes: selectedEntry.notes,
              }}
              onSuccess={handleDialogClose}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
