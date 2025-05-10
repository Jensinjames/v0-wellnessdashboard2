"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Check } from "lucide-react"
import { type WellnessCategory, createCategory, updateCategory } from "@/app/actions/categories"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Import the hook
import { useBatchedSupabase } from "@/hooks/use-batched-supabase"

interface CategoryFormProps {
  onClose: () => void
  mode: "create" | "edit"
  category?: WellnessCategory
  onSuccess?: (category: WellnessCategory) => void
  useBatching?: boolean
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

export function CategoryForm({ onClose, mode, category, onSuccess, useBatching = false }: CategoryFormProps) {
  const { user } = useAuth()
  const batchedSupabase = useBatchedSupabase()
  const [name, setName] = useState(category?.name || "")
  const [color, setColor] = useState(category?.color || "#8b5cf6")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [demoMode, setDemoMode] = useState(false)

  // Check if we're in demo mode
  useEffect(() => {
    if (user && user.id.startsWith("mock-")) {
      setDemoMode(true)
    }
  }, [user])

  const handleSubmit = async () => {
    if (!user) return

    // Validate inputs
    if (!name.trim()) {
      setError("Category name is required")
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      // If in demo mode, just simulate success
      if (demoMode) {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Create a mock category result
        const mockCategory: WellnessCategory = {
          id: mode === "create" ? `mock-${Math.random().toString(36).substring(2, 9)}` : category?.id || "",
          name,
          color,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        setSuccess(`Category ${mode === "create" ? "created" : "updated"} successfully (Demo Mode)`)

        // Call onSuccess callback with the mock category
        if (onSuccess) {
          onSuccess(mockCategory)
        }

        setTimeout(() => {
          onClose()
        }, 1500)
        return
      }

      let updatedCategory: WellnessCategory | null = null

      if (useBatching && batchedSupabase) {
        // Use batched requests with bypassBatching for critical operations
        if (mode === "create") {
          try {
            const createResult = await batchedSupabase.executeBatchedQuery(
              async () => {
                const result = await createCategory(user.id, {
                  name,
                  color,
                  user_id: user.id,
                })
                return { data: result, error: result.success ? null : new Error(result.error) }
              },
              {
                priority: "high",
                category: "categories",
                bypassBatching: true, // Bypass batching for critical operations
                onError: (err) => {
                  setError(err.message || "Failed to create category")
                },
              },
            )

            if (createResult.success && createResult.id) {
              updatedCategory = {
                id: createResult.id,
                name,
                color,
                user_id: user.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            }
          } catch (err: any) {
            setError(err.message || "Failed to create category")
            setIsSubmitting(false)
            return
          }
        } else if (category) {
          try {
            const updateResult = await batchedSupabase.executeBatchedQuery(
              async () => {
                const result = await updateCategory(user.id, category.id, {
                  name,
                  color,
                })
                return { data: result, error: result.success ? null : new Error(result.error) }
              },
              {
                priority: "high",
                category: "categories",
                bypassBatching: true, // Bypass batching for critical operations
                onError: (err) => {
                  setError(err.message || "Failed to update category")
                },
              },
            )

            if (updateResult.success) {
              updatedCategory = {
                ...category,
                name,
                color,
                updated_at: new Date().toISOString(),
              }
            }
          } catch (err: any) {
            setError(err.message || "Failed to update category")
            setIsSubmitting(false)
            return
          }
        }
      } else {
        // Use regular requests
        let result
        if (mode === "create") {
          result = await createCategory(user.id, {
            name,
            color,
            user_id: user.id,
          })

          if (result.success && result.id) {
            updatedCategory = {
              id: result.id,
              name,
              color,
              user_id: user.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          }
        } else if (category) {
          result = await updateCategory(user.id, category.id, {
            name,
            color,
          })

          if (result.success) {
            updatedCategory = {
              ...category,
              name,
              color,
              updated_at: new Date().toISOString(),
            }
          }
        }

        if (!result?.success) {
          setError(result?.error || "Failed to save category")
          setIsSubmitting(false)
          return
        }
      }

      // If we have an updated category, it means the operation was successful
      if (updatedCategory) {
        setSuccess(`Category ${mode === "create" ? "created" : "updated"} successfully`)

        // Call onSuccess callback with the updated category
        if (onSuccess) {
          onSuccess(updatedCategory)
        }

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
            <Label htmlFor="name">Category Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Meditation, Reading, Exercise"
              disabled={isSubmitting}
            />
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
                disabled={isSubmitting}
                className="font-mono"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting
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
