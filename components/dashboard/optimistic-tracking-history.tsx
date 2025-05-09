"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { useOptimisticWellness } from "@/hooks/use-optimistic-wellness"
import { deleteEntry } from "@/app/actions/entry-actions"
import type { WellnessEntry, WellnessCategory } from "@/types/wellness"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface OptimisticTrackingHistoryProps {
  rawEntries: WellnessEntry[]
  categories: WellnessCategory[]
}

export function OptimisticTrackingHistory({ rawEntries, categories }: OptimisticTrackingHistoryProps) {
  const { applyOptimisticEntries, deleteOptimisticEntry, confirmUpdate, failUpdate } = useOptimisticWellness()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<WellnessEntry | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Apply optimistic updates to entries
  const entries = applyOptimisticEntries(rawEntries)

  // Sort entries by timestamp, newest first
  const sortedEntries = [...entries].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  // Format time
  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Get category name and color
  const getCategoryInfo = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    return {
      name: category?.name || "Unknown",
      color: category?.color || "#cccccc",
    }
  }

  // Handle delete confirmation
  const confirmDelete = async () => {
    if (!entryToDelete) return

    setIsDeleting(true)

    // Optimistically delete the entry
    deleteOptimisticEntry(entryToDelete.id, entryToDelete)

    try {
      // Perform the actual deletion
      const result = await deleteEntry(entryToDelete.id)

      if (result.success) {
        // Confirm the delete operation was successful
        confirmUpdate(entryToDelete.id)
      } else {
        // Mark the operation as failed
        failUpdate(entryToDelete.id, new Error(result.error))
      }
    } catch (error) {
      // Mark the operation as failed
      failUpdate(entryToDelete.id, error instanceof Error ? error : new Error("Delete operation failed"))
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setEntryToDelete(null)
    }
  }

  // Handle delete click
  const handleDeleteClick = (entry: WellnessEntry) => {
    setEntryToDelete(entry)
    setDeleteDialogOpen(true)
  }

  // Render empty state
  if (sortedEntries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No activities tracked yet. Start tracking your wellness activities!
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {sortedEntries.map((entry) => {
          const category = getCategoryInfo(entry.category)
          const isOptimistic = entry.__optimistic

          return (
            <div
              key={entry.id}
              className={`p-3 border rounded-lg flex justify-between items-start
                ${isOptimistic ? "border-dashed bg-gray-50" : ""}`}
            >
              <div className="flex items-start space-x-3">
                <div
                  className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
                  style={{ backgroundColor: category.color }}
                ></div>
                <div>
                  <div className="font-medium">{entry.activity}</div>
                  <div className="text-sm text-gray-500 flex flex-wrap gap-x-2">
                    <span>{category.name}</span>
                    <span>•</span>
                    <span>
                      {entry.duration} {entry.duration === 1 ? "hour" : "hours"}
                    </span>
                    <span>•</span>
                    <span>
                      {formatDate(entry.timestamp)} at {formatTime(entry.timestamp)}
                    </span>
                    {isOptimistic && <span className="text-blue-500 italic">• Saving...</span>}
                  </div>
                  {entry.notes && <div className="text-sm mt-1">{entry.notes}</div>}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-red-500"
                onClick={() => handleDeleteClick(entry)}
                disabled={isDeleting || isOptimistic}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )
        })}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this activity entry. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className="bg-red-500 hover:bg-red-600">
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
