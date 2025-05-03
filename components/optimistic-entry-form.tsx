"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useWellness } from "@/context/wellness-context"
import { useEntryOptimistic } from "@/hooks/use-entry-optimistic"

// UI Components
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

// Define the form schema
const formSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  metricId: z.string().min(1, "Metric is required"),
  value: z.coerce.number().min(0, "Value must be a positive number"),
  date: z.date(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface OptimisticEntryFormProps {
  onSuccess?: () => void
  defaultValues?: Partial<FormValues>
  entryId?: string
}

export function OptimisticEntryForm({ onSuccess, defaultValues, entryId }: OptimisticEntryFormProps) {
  const { categories, addEntry, updateEntry, removeEntry } = useWellness()
  const {
    addEntryOptimistically,
    updateEntryOptimistically,
    deleteEntryOptimistically,
    operationStatus,
    isPendingEntry,
    resetStatus,
  } = useEntryOptimistic()

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(defaultValues?.categoryId || "")
  const [metrics, setMetrics] = useState<Array<{ id: string; name: string }>>([])

  // Set up form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryId: defaultValues?.categoryId || "",
      metricId: defaultValues?.metricId || "",
      value: defaultValues?.value || 0,
      date: defaultValues?.date || new Date(),
      notes: defaultValues?.notes || "",
    },
  })

  // Update metrics when category changes
  useEffect(() => {
    if (selectedCategoryId) {
      const category = categories.find((c) => c.id === selectedCategoryId)
      if (category) {
        setMetrics(category.metrics)
      } else {
        setMetrics([])
      }
    } else {
      setMetrics([])
    }
  }, [selectedCategoryId, categories])

  // Handle category change
  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value)
    form.setValue("categoryId", value)
    form.setValue("metricId", "")
  }

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    if (entryId) {
      // Update existing entry
      const success = await updateEntryOptimistically(
        entryId,
        {
          categoryId: values.categoryId,
          metricId: values.metricId,
          value: values.value,
          date: values.date,
          notes: values.notes,
        },
        updateEntry,
      )

      if (success && onSuccess) {
        onSuccess()
      }
    } else {
      // Add new entry
      const success = await addEntryOptimistically(
        {
          categoryId: values.categoryId,
          metricId: values.metricId,
          value: values.value,
          date: values.date,
          notes: values.notes || "",
        },
        addEntry,
      )

      if (success) {
        // Reset form
        form.reset({
          categoryId: "",
          metricId: "",
          value: 0,
          date: new Date(),
          notes: "",
        })
        setSelectedCategoryId("")

        if (onSuccess) {
          onSuccess()
        }
      }
    }
  }

  // Handle entry deletion
  const handleDelete = async () => {
    if (!entryId) return

    const confirmed = window.confirm("Are you sure you want to delete this entry?")
    if (!confirmed) return

    const success = await deleteEntryOptimistically(entryId, removeEntry)

    if (success && onSuccess) {
      onSuccess()
    }
  }

  // Reset status when component unmounts
  useEffect(() => {
    return () => {
      resetStatus()
    }
  }, [resetStatus])

  const isPending = operationStatus === "pending" || (entryId ? isPendingEntry(entryId) : false)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Category Selection */}
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select disabled={isPending} onValueChange={handleCategoryChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className={isPending ? "opacity-70" : ""}>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
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

        {/* Metric Selection */}
        <FormField
          control={form.control}
          name="metricId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Metric</FormLabel>
              <Select disabled={isPending || !selectedCategoryId} onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className={isPending ? "opacity-70" : ""}>
                    <SelectValue placeholder="Select a metric" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {metrics.map((metric) => (
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

        {/* Value Input */}
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Value</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  disabled={isPending}
                  className={isPending ? "opacity-70" : ""}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date Selection */}
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground",
                        isPending && "opacity-70",
                      )}
                      disabled={isPending}
                    >
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes Textarea */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any additional notes here..."
                  className={isPending ? "opacity-70" : ""}
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormDescription>Optional: Add any additional information about this entry.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className="flex justify-between">
          <Button type="submit" disabled={isPending} className={cn(isPending && "opacity-70")}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {entryId ? "Update Entry" : "Add Entry"}
          </Button>

          {entryId && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
              className={cn(isPending && "opacity-70")}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Entry
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}
