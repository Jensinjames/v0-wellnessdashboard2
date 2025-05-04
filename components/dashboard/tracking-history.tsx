"use client"

import { useWellnessMetrics } from "@/context/wellness-metrics-context"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { Pencil, Trash2 } from "lucide-react"
import { useState } from "react"
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

const categoryLabels = {
  faith: "Faith",
  life: "Life",
  work: "Work",
  health: "Health",
}

const categoryColors = {
  faith: "bg-purple-100 text-purple-800",
  life: "bg-green-100 text-green-800",
  work: "bg-yellow-100 text-yellow-800",
  health: "bg-orange-100 text-orange-800",
}

export function TrackingHistory() {
  const { metrics, deleteEntry } = useWellnessMetrics()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      setIsDeleting(true)
      await deleteEntry(deleteId)
    } catch (error) {
      console.error("Error deleting entry:", error)
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  if (metrics.entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No tracking history yet. Start adding entries to see your progress!
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.entries.slice(0, 10).map((entry) => (
          <div key={entry.id} className="border rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{entry.activity}</div>
                <div className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => setDeleteId(entry.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div
                className={`px-2 py-1 rounded-full text-xs ${categoryColors[entry.category as keyof typeof categoryColors]}`}
              >
                {categoryLabels[entry.category as keyof typeof categoryLabels]}
              </div>
              <div className="text-sm font-medium">{(entry.duration / 60).toFixed(1)} hours</div>
            </div>

            {entry.notes && <div className="text-sm text-muted-foreground mt-2">{entry.notes}</div>}
          </div>
        ))}
      </div>

      {metrics.entries.length > 10 && (
        <div className="flex justify-center mt-4">
          <Button variant="outline">View All Entries</Button>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this wellness entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
