"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Check } from "lucide-react"
import type { WellnessCategory } from "@/types/wellness"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { createCategory, updateCategory } from "@/app/actions/category-actions"
import { useOptimisticAction } from "@/hooks/use-optimistic-action"

interface OptimisticCategoryFormProps {
  onClose: () => void
  mode: "create" | "edit"
  category?: WellnessCategory
  onSuccess?: (category: WellnessCategory) => void
}

// Predefined colors for the color picker
const colorOptions = [
  "#8b5cf6", // Purple (Faith)
  "#ec4899", // Pink (Life)
  "#f59e0b", // Amber (Work)
  "#10b981", // Emerald (Health)
  "#3b82f6", // Blue
  "#ef4444", // Red
  "#84cc16", // Lime
  "#06b6d4", // Cyan
  "#6366f1", // Indigo
  "#d946ef", // Fuchsia
  "#0ea5e9", // Sky
  "#14b8a6", // Teal
  "#f97316", // Orange
  "#8b5cf6", // Violet
  "#64748b", // Slate
]

export function OptimisticCategoryForm({ onClose, mode, category, onSuccess }: OptimisticCategoryFormProps) {
  const [name, setName] = useState(category?.name || "")
  const [color, setColor] = useState(category?.color || "#8b5cf6")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState<string | null>(null)

  // Set up optimistic action for create
  const {
    execute: executeCreateCategory,
    isLoading: isCreating,
    isError: isCreateError,
    error: createError,
  } = useOptimisticAction({
    action: createCategory,
    table: "wellness_categories",
    operation: "insert",
    getOptimisticData: (data) => {
      const timestamp = new Date().toISOString()
      return {
        id: `temp_${Date.now()}`,
        name: data.name,
        color: data.color,
        icon: data.icon || null,
        created_at: timestamp,
        updated_at: timestamp,
        __optimistic: true,
      }
    },
    onSuccess: (result) => {
      if (result.success && result.data) {
        setSuccess(result.message || `Category ${mode === "create" ? "created" : "updated"} successfully`)

        // Call onSuccess callback with the updated category
        if (onSuccess) {
          onSuccess(result.data)
        }

        // Close the dialog after a short delay
        setTimeout(() => {
          onClose()
        }, 1500)
      }
    },
  })

  // Set up optimistic action for update
  const {
    execute: executeUpdateCategory,
    isLoading: isUpdating,
    isError: isUpdateError,
    error: updateError,
  } = useOptimisticAction({
    action: (data) => updateCategory(category?.id || "", data),
    table: "wellness_categories",
    operation: "update",
    getOptimisticData: (data) => ({
      ...category,
      name: data.name,
      color: data.color,
      icon: data.icon || null,
      updated_at: new Date().toISOString(),
      __optimistic: true,
    }),
    optimisticId: category?.id,
    originalData: category,
    onSuccess: (result) => {
      if (result.success && result.data) {
        setSuccess(result.message || `Category ${mode === "create" ? "created" : "updated"} successfully`)

        // Call onSuccess callback with the updated category
        if (onSuccess) {
          onSuccess(result.data)
        }

        // Close the dialog after a short delay
        setTimeout(() => {
          onClose()
        }, 1500)
      }
    },
  })

  const isLoading = isCreating || isUpdating
  const error = createError || updateError
  const isError = isCreateError || isUpdateError

  const handleSubmit = async () => {
    // Clear previous errors and success messages
    setFieldErrors({})
    setSuccess(null)

    // Validate inputs
    if (!name.trim()) {
      setFieldErrors({ name: "Category name is required" })
      return
    }

    // Prepare the form data
    const formData = {
      name,
      color,
      icon: category?.icon || null,
    }

    if (mode === "create") {
      // Create new category
      const result = await executeCreateCategory(formData)

      // Handle field errors
      if (!result.success && result.error && "fieldErrors" in result.error) {
        setFieldErrors(result.error.fieldErrors || {})
      }
    } else if (category) {
      // Update existing category
      const result = await executeUpdateCategory(formData)

      // Handle field errors
      if (!result.success && result.error && "fieldErrors" in result.error) {
        setFieldErrors(result.error.fieldErrors || {})
      }
    }
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create" : "Edit"} Category</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new wellness category to track your activities"
              : "Update your wellness category details"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isError && error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
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
            <Label htmlFor="name">Category Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Meditation, Reading, Exercise"
              disabled={isLoading}
              className={fieldErrors.name ? "border-red-500" : ""}
            />
            {fieldErrors.name && <p className="text-sm text-red-500">{fieldErrors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Category Color</Label>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-10 p-0 border-2"
                    style={{
                      backgroundColor: color,
                      borderColor: color,
                    }}
                  >
                    <span className="sr-only">Pick a color</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="grid grid-cols-5 gap-2">
                    {colorOptions.map((c) => (
                      <Button
                        key={c}
                        variant="outline"
                        className="w-10 h-10 p-0 border-2"
                        style={{
                          backgroundColor: c,
                          borderColor: c === color ? "white" : c,
                        }}
                        onClick={() => setColor(c)}
                      >
                        {c === color && <Check className="h-4 w-4 text-white" />}
                        <span className="sr-only">{c}</span>
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Input
                id="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                disabled={isLoading}
                className={`font-mono ${fieldErrors.color ? "border-red-500" : ""}`}
              />
              {fieldErrors.color && <p className="text-sm text-red-500">{fieldErrors.color}</p>}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading
              ? mode === "create"
                ? "Creating..."
                : "Updating..."
              : mode === "create"
                ? "Create Category"
                : "Update Category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
