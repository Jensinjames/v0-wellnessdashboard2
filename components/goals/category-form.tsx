"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useGoalHierarchy } from "@/hooks/use-goal-hierarchy"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { HexColorPicker } from "react-colorful"
import { Plus } from "lucide-react"
import type { GoalCategory } from "@/types/goals-hierarchy"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name cannot exceed 50 characters"),
  description: z.string().max(200, "Description cannot exceed 200 characters").optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color"),
  daily_time_allocation: z.coerce.number().min(0, "Time cannot be negative").max(24, "Time cannot exceed 24 hours"),
})

type FormValues = z.infer<typeof formSchema>

interface CategoryFormProps {
  open: boolean
  onClose: () => void
  initialData?: GoalCategory
  mode: "create" | "edit"
}

export function CategoryForm({ open, onClose, initialData, mode }: CategoryFormProps) {
  const { createCategory, updateCategory } = useGoalHierarchy()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      color: initialData?.color || "#4f46e5",
      daily_time_allocation: initialData?.daily_time_allocation || 0,
    },
  })

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)

    try {
      if (mode === "create") {
        await createCategory(values)
      } else if (initialData) {
        await updateCategory(initialData.id, values)
      }

      form.reset()
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create a New Category" : "Edit Category"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Create a new category to organize your goals" : "Update this category's information"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Category name" {...field} />
                  </FormControl>
                  <FormDescription>A short, descriptive name for this category</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Brief description..." {...field} />
                  </FormControl>
                  <FormDescription>A brief description of what this category encompasses</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full border" style={{ backgroundColor: field.value }} />
                        <Input value={field.value} onChange={field.onChange} />
                      </div>
                      <HexColorPicker color={field.value} onChange={field.onChange} />
                    </div>
                  </FormControl>
                  <FormDescription>Choose a color to represent this category</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="daily_time_allocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Daily Time Allocation (hours)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.25" min="0" max="24" {...field} />
                  </FormControl>
                  <FormDescription>How many hours would you like to allocate to this category daily?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="flex items-center">
                    <span className="mr-2">
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    </span>
                    {mode === "create" ? "Creating..." : "Updating..."}
                  </div>
                ) : mode === "create" ? (
                  <div className="flex items-center">
                    <Plus className="mr-1 h-4 w-4" />
                    Create Category
                  </div>
                ) : (
                  "Update Category"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
