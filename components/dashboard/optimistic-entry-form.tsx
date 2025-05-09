"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Check, Plus } from "lucide-react"
import type { WellnessCategory, WellnessEntry } from "@/types/wellness"
import { addEntry } from "@/app/actions/entry-actions"
import { useOptimisticWellness } from "@/hooks/use-optimistic-wellness"

interface OptimisticEntryFormProps {
  categories: WellnessCategory[]
  onSuccess?: () => void
  userId: string
}

export function OptimisticEntryForm({ categories, onSuccess, userId }: OptimisticEntryFormProps) {
  const [formData, setFormData] = useState({
    category: "",
    activity: "",
    duration: "1",
    notes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState<string | null>(null)

  const { addOptimisticEntry, confirmUpdate, failUpdate } = useOptimisticWellness()

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle select change
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Clear previous errors and success messages
    setError(null)
    setFieldErrors({})
    setSuccess(null)

    // Validate inputs
    if (!formData.category) {
      setFieldErrors({ category: "Category is required" })
      return
    }

    if (!formData.activity.trim()) {
      setFieldErrors({ activity: "Activity is required" })
      return
    }

    const duration = Number.parseFloat(formData.duration)
    if (isNaN(duration) || duration <= 0) {
      setFieldErrors({ duration: "Duration must be a positive number" })
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare the data
      const entryData: Omit<WellnessEntry, "id" | "created_at"> = {
        user_id: userId,
        category: formData.category,
        activity: formData.activity,
        duration: Number.parseFloat(formData.duration),
        notes: formData.notes || null,
        timestamp: new Date().toISOString(),
      }

      // Create optimistic entry
      const optimisticEntry = addOptimisticEntry(entryData)

      // Prepare the data for the server action
      const serverData = {
        ...formData,
        duration: Number.parseFloat(formData.duration),
      }

      // Call the server action
      const result = await addEntry(serverData)

      if (!result.success) {
        // Handle field errors
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors)
        }
        // Handle general error
        setError(result.error)
        // Mark optimistic update as failed
        failUpdate(optimisticEntry.id, new Error(result.error))
        return
      }

      // Confirm the optimistic update with the real data
      confirmUpdate(optimisticEntry.id, result.data)

      // Handle success
      setSuccess(result.message || "Entry added successfully")

      // Reset form
      setFormData({
        category: "",
        activity: "",
        duration: "1",
        notes: "",
      })

      // Call onSuccess callback
      if (onSuccess) {
        onSuccess()
      }

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Find the selected category to display its color
  const selectedCategory = categories.find((cat) => cat.id === formData.category)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        <Select
          value={formData.category}
          onValueChange={(value) => handleSelectChange("category", value)}
          disabled={isSubmitting}
        >
          <SelectTrigger className={fieldErrors.category ? "border-red-500" : ""}>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: category.color }}></div>
                  {category.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldErrors.category && <p className="text-sm text-red-500">{fieldErrors.category}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="activity">Activity</Label>
        <Input
          id="activity"
          name="activity"
          value={formData.activity}
          onChange={handleChange}
          placeholder="e.g., Yoga, Reading, Meditation"
          disabled={isSubmitting}
          className={fieldErrors.activity ? "border-red-500" : ""}
        />
        {fieldErrors.activity && <p className="text-sm text-red-500">{fieldErrors.activity}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">Duration (hours)</Label>
        <Input
          id="duration"
          name="duration"
          type="number"
          step="0.25"
          min="0.25"
          value={formData.duration}
          onChange={handleChange}
          disabled={isSubmitting}
          className={fieldErrors.duration ? "border-red-500" : ""}
        />
        {fieldErrors.duration && <p className="text-sm text-red-500">{fieldErrors.duration}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Add any notes about this activity"
          disabled={isSubmitting}
          className={fieldErrors.notes ? "border-red-500" : ""}
        />
        {fieldErrors.notes && <p className="text-sm text-red-500">{fieldErrors.notes}</p>}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
        style={{
          backgroundColor: selectedCategory ? selectedCategory.color : undefined,
          borderColor: selectedCategory ? selectedCategory.color : undefined,
        }}
      >
        {isSubmitting ? (
          "Adding Entry..."
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" />
            Add Entry
          </>
        )}
      </Button>
    </form>
  )
}
