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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import type { GoalSubcategory } from "@/types/goals-hierarchy"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name cannot exceed 50 characters"),
  description: z.string().max(200, "Description cannot exceed 200 characters").optional(),
  category_id: z.string().uuid("Please select a valid category"),
  daily_time_allocation: z.coerce.number().min(0, "Time cannot be negative").max(24, "Time cannot exceed 24 hours"),
})

type FormValues = z.infer<typeof formSchema>

interface SubcategoryFormProps {
  open: boolean
  onClose: () => void
  initialData?: GoalSubcategory
  parentCategoryId?: string
  mode: "create" | "edit"
}

export function SubcategoryForm({ open, onClose, initialData, parentCategoryId, mode }: SubcategoryFormProps) {
  const { createSubcategory, updateSubcategory, categories } = useGoalHierarchy()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      category_id: initialData?.category_id || parentCategoryId || "",
      daily_time_allocation: initialData?.daily_time_allocation || 0,
    },
  })

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)

    try {
      if (mode === "create") {
        await createSubcategory(values)
      } else if (initialData) {
        await updateSubcategory(initialData.id, values)
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
          <DialogTitle>{mode === "create" ? "Create a New Subcategory" : "Edit Subcategory"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new subcategory to better organize your goals"
              : "Update this subcategory's information"}
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
                    <Input placeholder="Subcategory name" {...field} />
                  </FormControl>
                  <FormDescription>A descriptive name for this subcategory</FormDescription>
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
                  <FormDescription>A brief description of what this subcategory encompasses</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a parent category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                            <span>{category.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Select which category this subcategory belongs to</FormDescription>
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
                  <FormDescription>
                    How many hours would you like to allocate to this subcategory daily?
                  </FormDescription>
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
                    Create Subcategory
                  </div>
                ) : (
                  "Update Subcategory"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
