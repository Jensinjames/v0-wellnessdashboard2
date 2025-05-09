"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Plus } from "lucide-react"
import { addEntry } from "@/app/actions/entry-actions"
import { useOptimisticAction } from "@/hooks/use-optimistic-action"
import type { WellnessCategory } from "@/types/wellness"

interface OptimisticServerActionEntryFormProps {
  categories: WellnessCategory[]
  onSuccess?: () => void
  userId: string
}

export function OptimisticServerActionEntryForm({
  categories,
  onSuccess,
  userId,
}: OptimisticServerActionEntryFormProps) {
  const [formData, setFormData] = useState({
    category: "",
    activity: "",
    duration: "1",
    notes: "",
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Set up optimistic action
  const {
    execute: executeAddEntry,
    isLoading,
    isError,
    error,
  } = useOptimisticAction({
    action: addEntry,
    table: "wellness_entries",
    operation: "insert",
    getOptimisticData: (data) => {
      const timestamp = new Date().toISOString()
      return {
        id: `temp_${Date.now()}`,
        user_id: userId,
        category: data.category,
        activity: data.activity,
        duration: typeof data.duration === "string" ? Number.parseFloat(data.duration) : data.duration,
        notes: data.notes || null,
        timestamp,
        created_at: timestamp,
        __optimistic: true,
      }
    },
    onSuccess: () => {
      // Reset form on success
      setFormData({
        category: "",
        activity: "",
        duration: "1",
        notes: "",
      })
      setFieldErrors({})

      // Call success callback
      if (onSuccess) {
        onSuccess()
      }
    },
  })

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

    // Clear previous errors
    setFieldErrors({})

    // Validate inputs
    let hasErrors = false
    const newFieldErrors: Record<string, string> = {}

    if (!formData.category) {
      newFieldErrors.category = "Category is required"
      hasErrors = true
    }

    if (!formData.activity.trim()) {
      newFieldErrors.activity = "Activity is required"
      hasErrors = true
    }

    const duration = Number.parseFloat(formData.duration)
    if (isNaN(duration) || duration <= 0) {
      newFieldErrors.duration = "Duration must be a positive number"
      hasErrors = true
    }

    if (hasErrors) {
      setFieldErrors(newFieldErrors)
      return
    }

    // Execute the optimistic action
    const result = await executeAddEntry(formData)

    // Handle field errors from server action
    if (!result.success && result.error && "fieldErrors" in result.error) {
      setFieldErrors(result.error.fieldErrors || {})
    }
  }

  // Find the selected category to display its color
  const selectedCategory = categories.find((cat) => cat.id === formData.category)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isError && error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => handleSelectChange("category", value)}
          disabled={isLoading}
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
          disabled={isLoading}
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
          disabled={isLoading}
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
          disabled={isLoading}
          className={fieldErrors.notes ? "border-red-500" : ""}
        />
        {fieldErrors.notes && <p className="text-sm text-red-500">{fieldErrors.notes}</p>}
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full"
        style={{
          backgroundColor: selectedCategory ? selectedCategory.color : undefined,
          borderColor: selectedCategory ? selectedCategory.color : undefined,
        }}
      >
        {isLoading ? (
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
