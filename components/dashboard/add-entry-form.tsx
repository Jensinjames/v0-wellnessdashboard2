"use client"

import { useState } from "react"
import { useWellnessData, type WellnessEntry } from "@/hooks/use-wellness-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Check } from "lucide-react"

interface AddEntryFormProps {
  open: boolean
  onClose: () => void
}

export function AddEntryForm({ open, onClose }: AddEntryFormProps) {
  const { categories, addEntry } = useWellnessData()
  const [category, setCategory] = useState("")
  const [activity, setActivity] = useState("")
  const [duration, setDuration] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async () => {
    // Validate inputs
    if (!category) {
      setError("Please select a category")
      return
    }
    if (!activity) {
      setError("Activity name is required")
      return
    }
    if (!duration || isNaN(Number(duration)) || Number(duration) <= 0) {
      setError("Please enter a valid duration in minutes")
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const newEntry: Omit<WellnessEntry, "id" | "created_at"> = {
        category,
        activity,
        duration: Number(duration),
        notes: notes || undefined,
        timestamp: new Date().toISOString(),
        metadata: {},
      }

      const result = await addEntry(newEntry)

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess("Entry added successfully")

        // Reset form
        setCategory("")
        setActivity("")
        setDuration("")
        setNotes("")

        // Close dialog after a short delay
        setTimeout(() => {
          onClose()
        }, 1500)
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Wellness Entry</DialogTitle>
          <DialogDescription>Record a new wellness activity to track your progress</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <Check className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span>{cat.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity">Activity</Label>
            <Input
              id="activity"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              placeholder="e.g., Meditation, Running, Reading"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g., 30"
              min="1"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes about this activity"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
