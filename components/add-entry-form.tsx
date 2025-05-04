"use client"

import type React from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import * as z from "zod"
import { useEffect } from "react"
import * as LucideIcons from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { useWellness } from "@/context/wellness-context"
import {
  type WellnessCategory,
  type WellnessEntryData,
  type WellnessEntryMetric,
  getUnitLabel,
  getStressLevelLabel,
} from "@/types/wellness"

interface AddEntryFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entryToEdit?: WellnessEntryData | null
}

export function AddEntryForm({ open, onOpenChange, entryToEdit }: AddEntryFormProps) {
  const { categories, addEntry, updateEntry } = useWellness()
  const enabledCategories = categories.filter((cat) => cat.enabled)

  // Create a dynamic form schema based on categories
  const createFormSchema = () => {
    const schemaFields: Record<string, any> = {
      id: z.string().optional(),
      date: z.date({
        required_error: "A date is required.",
      }),
    }

    // Add fields for each metric in enabled categories
    enabledCategories.forEach((category) => {
      category.metrics.forEach((metric) => {
        schemaFields[`${category.id}_${metric.id}`] = z
          .number()
          .min(metric.min)
          .max(metric.max)
          .default(metric.defaultValue)
      })
    })

    return z.object(schemaFields)
  }

  const formSchema = createFormSchema()
  type FormValues = z.infer<typeof formSchema>

  // Get default values from current entry or defaults
  function getDefaultValues(): Partial<FormValues> {
    const values: Record<string, any> = {
      date: new Date(),
    }

    if (entryToEdit) {
      values.id = entryToEdit.id
      values.date = new Date(entryToEdit.date)

      // Set values from entry metrics
      entryToEdit.metrics.forEach((metric) => {
        values[`${metric.categoryId}_${metric.metricId}`] = metric.value
      })
    } else {
      // Set default values for all metrics
      enabledCategories.forEach((category) => {
        category.metrics.forEach((metric) => {
          values[`${category.id}_${metric.id}`] = metric.defaultValue
        })
      })
    }

    return values
  }

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
  })

  // Update form values when editing an entry
  useEffect(() => {
    if (entryToEdit) {
      const values = getDefaultValues()
      form.reset(values)
    } else {
      form.reset(getDefaultValues())
    }
  }, [entryToEdit, form])

  // Form submission handler
  function onSubmit(data: FormValues) {
    // Convert form data to entry format
    const metrics: WellnessEntryMetric[] = []

    enabledCategories.forEach((category) => {
      category.metrics.forEach((metric) => {
        const fieldName = `${category.id}_${metric.id}`
        const value = data[fieldName as keyof FormValues] as number

        metrics.push({
          categoryId: category.id,
          metricId: metric.id,
          value,
        })
      })
    })

    const entryData: WellnessEntryData = {
      id: data.id || crypto.randomUUID(),
      date: data.date,
      metrics,
    }

    if (entryToEdit) {
      updateEntry(entryToEdit.id, entryData)
    } else {
      addEntry(entryData)
    }

    onOpenChange(false)
  }

  // Get icon component by name
  const getIconByName = (name: string) => {
    const Icon = (LucideIcons as Record<string, React.ComponentType<any>>)[name]
    return Icon ? <Icon className="h-5 w-5 text-white" /> : null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{entryToEdit ? "Edit Wellness Entry" : "Add New Wellness Entry"}</DialogTitle>
          <DialogDescription>
            {entryToEdit
              ? "Update your wellness entry details below."
              : "Record your daily activities and metrics across all wellness categories."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Date Picker */}
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
                          variant={"outline"}
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
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

            {/* Category Tabs */}
            <Tabs defaultValue={enabledCategories[0]?.id} className="w-full">
              <TabsList className="grid grid-cols-4 w-full">
                {enabledCategories.slice(0, 4).map((category) => (
                  <TabsTrigger key={category.id} value={category.id}>
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Generate tab content for each category */}
              {enabledCategories.map((category) => (
                <TabsContent key={category.id} value={category.id} className="space-y-4 pt-4">
                  <div className={`bg-${category.color}-50 p-4 rounded-md space-y-4`}>
                    <h3 className={`font-medium text-${category.color}-800`}>{category.name} Activities</h3>

                    {/* Generate form fields for each metric in the category */}
                    {category.metrics.map((metric) => (
                      <MetricEntryField
                        key={`${category.id}_${metric.id}`}
                        category={category}
                        metric={metric}
                        form={form}
                      />
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            {/* Additional categories section */}
            {enabledCategories.length > 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Additional Categories</h3>

                {enabledCategories.slice(4).map((category) => (
                  <div key={category.id} className={`bg-${category.color}-50 p-4 rounded-md space-y-4 mb-4`}>
                    <h3 className={`font-medium text-${category.color}-800`}>{category.name} Activities</h3>

                    {/* Generate form fields for each metric in the category */}
                    {category.metrics.map((metric) => (
                      <MetricEntryField
                        key={`${category.id}_${metric.id}`}
                        category={category}
                        metric={metric}
                        form={form}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{entryToEdit ? "Update" : "Save"} Entry</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// Component for rendering a metric entry field
interface MetricEntryFieldProps {
  category: WellnessCategory
  metric: {
    id: string
    name: string
    description?: string
    unit: string
    min: number
    max: number
    step: number
  }
  form: any
}

function MetricEntryField({ category, metric, form }: MetricEntryFieldProps) {
  const fieldName = `${category.id}_${metric.id}` as any

  // Render different input types based on the metric unit
  if (metric.unit === "count") {
    return (
      <FormField
        control={form.control}
        name={fieldName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{metric.name}</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={metric.min}
                max={metric.max}
                step={metric.step}
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }

  // For all other types, use a slider
  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => (
        <FormItem>
          <div className="flex justify-between">
            <FormLabel>{metric.name}</FormLabel>
            <span className="text-sm">
              {metric.unit === "level" && metric.id === "stressLevel"
                ? `${field.value} - ${getStressLevelLabel(field.value)}`
                : getUnitLabel(metric.unit, field.value)}
            </span>
          </div>
          <FormControl>
            <Slider
              min={metric.min}
              max={metric.max}
              step={metric.step}
              value={[field.value]}
              onValueChange={(value) => field.onChange(value[0])}
              className="py-4"
              aria-label={`${metric.name} value: ${field.value}`}
              aria-valuemin={metric.min}
              aria-valuemax={metric.max}
              aria-valuenow={field.value}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
