"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useWellness } from "@/context/wellness-context"
import { useTracking } from "@/context/tracking-context"
import type { CategoryId } from "@/types/wellness"

interface StartTrackingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const formSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  metricId: z.string().min(1, "Metric is required"),
  notes: z.string().optional(),
})

export function StartTrackingDialog({ open, onOpenChange }: StartTrackingDialogProps) {
  const { categories } = useWellness()
  const { startTracking } = useTracking()
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")

  const enabledCategories = categories.filter((cat) => cat.enabled)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryId: "",
      metricId: "",
      notes: "",
    },
  })

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    startTracking(data.categoryId as CategoryId, data.metricId, data.notes)
    form.reset()
    onOpenChange(false)
  }

  // Get metrics for the selected category
  const availableMetrics = selectedCategoryId ? categories.find((c) => c.id === selectedCategoryId)?.metrics || [] : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Start Activity Tracking</DialogTitle>
          <DialogDescription>
            Select a category and metric to start tracking. The timer will run until you stop it.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" id="tracking-form">
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="tracking-category">Category</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      setSelectedCategoryId(value)
                      // Reset metric when category changes
                      form.setValue("metricId", "")
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger id="tracking-category" aria-label="Select wellness category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {enabledCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="metricId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="tracking-metric">Metric</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedCategoryId}>
                    <FormControl>
                      <SelectTrigger id="tracking-metric" aria-label="Select metric to track">
                        <SelectValue placeholder="Select a metric" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableMetrics.map((metric) => (
                        <SelectItem key={metric.id} value={metric.id}>
                          {metric.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="tracking-notes">Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      id="tracking-notes"
                      placeholder="Add notes about this activity..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} id="cancel-tracking-button">
                Cancel
              </Button>
              <Button type="submit" id="start-tracking-button">
                <Play className="mr-1 h-4 w-4" aria-hidden="true" />
                Start Tracking
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
