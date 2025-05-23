"use client"

import type React from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import * as z from "zod"
import { useEffect, useRef, useState, useMemo } from "react"

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
import { safeCn, colorCn, conditionalCn } from "@/utils/safe-class-names"
import { useWellness } from "@/context/wellness-context"
import {
  type WellnessCategory,
  type WellnessEntryData,
  type WellnessEntryMetric,
  getUnitLabel,
  getStressLevelLabel,
} from "@/types/wellness"
import { getCategoryColorKey } from "@/utils/category-color-utils"

interface AddEntryFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entryToEdit?: WellnessEntryData | null
  categoryFilter?: string // Optional prop to filter by specific category
}

export function AddEntryForm({ open, onOpenChange, entryToEdit, categoryFilter }: AddEntryFormProps) {
  const { categories, addEntry, updateEntry } = useWellness()
  const statusRef = useRef<HTMLDivElement>(null)
  const valueChangesRef = useRef<HTMLDivElement>(null)

  // Memoize filtered categories to prevent unnecessary recalculations
  const enabledCategories = useMemo(() => categories.filter((cat) => cat.enabled), [categories])

  // Filter categories if categoryFilter is provided
  const filteredCategories = useMemo(() => {
    return categoryFilter ? enabledCategories.filter((cat) => cat.id === categoryFilter) : enabledCategories
  }, [enabledCategories, categoryFilter])

  // Set initial active tab based on filtered categories
  const initialActiveTab = useMemo(() => {
    return filteredCategories.length > 0 ? filteredCategories[0].id : ""
  }, [filteredCategories])

  const [activeTab, setActiveTab] = useState<string>(initialActiveTab)

  // Update active tab when filtered categories change
  useEffect(() => {
    if (filteredCategories.length > 0 && !filteredCategories.some((cat) => cat.id === activeTab)) {
      setActiveTab(filteredCategories[0].id)
    }
  }, [filteredCategories, activeTab])

  // Create a dynamic form schema based on categories - memoized to prevent recreation on every render
  const formSchema = useMemo(() => {
    const schemaFields: Record<string, any> = {
      id: z.string().optional(),
      date: z.date({
        required_error: "A date is required.",
      }),
    }

    // Add fields for each metric in enabled categories
    filteredCategories.forEach((category) => {
      category.metrics.forEach((metric) => {
        schemaFields[`${category.id}_${metric.id}`] = z
          .number()
          .min(metric.min)
          .max(metric.max)
          .default(metric.defaultValue)
      })
    })

    return z.object(schemaFields)
  }, [filteredCategories])

  type FormValues = z.infer<typeof formSchema>

  // Get default values from current entry or defaults - memoized to prevent recreation on every render
  const defaultValues = useMemo((): Partial<FormValues> => {
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
      filteredCategories.forEach((category) => {
        category.metrics.forEach((metric) => {
          values[`${category.id}_${metric.id}`] = metric.defaultValue
        })
      })
    }

    return values
  }, [entryToEdit, filteredCategories])

  // Initialize form with memoized resolver and default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onChange",
  })

  // Reset form when dialog opens or entry/categories change
  useEffect(() => {
    if (open) {
      form.reset(defaultValues)

      // Announce to screen readers
      if (statusRef.current) {
        if (entryToEdit) {
          statusRef.current.textContent = `Editing entry from ${format(new Date(entryToEdit.date), "MMMM d, yyyy")}`
        } else {
          statusRef.current.textContent = "Adding a new wellness entry"
        }
      }
    }
  }, [open, entryToEdit, form, defaultValues])

  // Form submission handler
  function onSubmit(data: FormValues) {
    // Convert form data to entry format
    const metrics: WellnessEntryMetric[] = []

    filteredCategories.forEach((category) => {
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

      // Announce to screen readers
      if (statusRef.current) {
        statusRef.current.textContent = `Entry for ${format(data.date, "MMMM d, yyyy")} has been updated successfully`
      }
    } else {
      addEntry(entryData)

      // Announce to screen readers
      if (statusRef.current) {
        statusRef.current.textContent = `New entry for ${format(data.date, "MMMM d, yyyy")} has been added successfully`
      }
    }

    onOpenChange(false)
  }

  // If no categories are available, show a message
  if (filteredCategories.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>No Categories Available</DialogTitle>
            <DialogDescription>You need to create and enable categories before you can add entries.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} aria-label="Close dialog">
              Close
            </Button>
            <Button
              onClick={() => {
                onOpenChange(false)
                // Navigate to categories page
                window.location.href = "/categories"
              }}
              formContext="category"
              aria-label="Manage categories"
            >
              Manage Categories
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <>
      {/* Hidden status announcer for screen readers */}
      <div className="sr-only" aria-live="assertive" aria-atomic="true" ref={statusRef}></div>

      {/* Hidden value changes announcer for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true" ref={valueChangesRef}></div>

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
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
              id="entry-form"
              data-category-filter={categoryFilter || "all"}
              aria-label={entryToEdit ? "Edit wellness entry form" : "Add new wellness entry form"}
            >
              {/* Date Picker */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel htmlFor="entry-date">Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            id="entry-date"
                            variant={"outline"}
                            className={safeCn(
                              "w-full pl-3 text-left font-normal",
                              conditionalCn({
                                condition: !field.value,
                                true: "text-muted-foreground",
                                false: "",
                              }),
                            )}
                            aria-label={field.value ? `Selected date: ${format(field.value, "PPP")}` : "Select a date"}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" aria-hidden="true" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            if (date) {
                              field.onChange(date)
                              // Announce date change to screen readers
                              if (valueChangesRef.current) {
                                valueChangesRef.current.textContent = `Date set to ${format(date, "MMMM d, yyyy")}`
                              }
                            }
                          }}
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Only show tabs if there's more than one category */}
              {filteredCategories.length > 1 ? (
                <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-4 w-full">
                    {filteredCategories.slice(0, 4).map((category) => (
                      <TabsTrigger
                        key={category.id}
                        value={category.id}
                        id={`tab-${category.id}`}
                        className={conditionalCn({
                          condition: activeTab === category.id,
                          true: "font-medium",
                          false: "",
                        })}
                      >
                        {category.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {/* Generate tab content for each category */}
                  {filteredCategories.map((category) => {
                    const categoryColor = getCategoryColorKey(category.id)

                    return (
                      <TabsContent
                        key={category.id}
                        value={category.id}
                        className="space-y-4 pt-4"
                        id={`tabpanel-${category.id}`}
                      >
                        <div
                          className={safeCn(
                            "p-4 rounded-md space-y-4 border",
                            colorCn("bg", categoryColor, "50", { dark: `${categoryColor}-950/20` }),
                            "border-slate-200 dark:border-slate-800",
                          )}
                        >
                          <h3
                            className={safeCn(
                              "font-medium",
                              colorCn("text", categoryColor, "800", { dark: `${categoryColor}-300` }),
                            )}
                          >
                            {category.name} Activities
                          </h3>

                          {/* Generate form fields for each metric in the category */}
                          {category.metrics.map((metric) => (
                            <MetricEntryField
                              key={`${category.id}_${metric.id}`}
                              category={category}
                              metric={metric}
                              form={form}
                              valueChangesRef={valueChangesRef}
                            />
                          ))}
                        </div>
                      </TabsContent>
                    )
                  })}
                </Tabs>
              ) : (
                // If there's only one category, show it directly without tabs
                filteredCategories.map((category) => {
                  const categoryColor = getCategoryColorKey(category.id)

                  return (
                    <div
                      key={category.id}
                      className={safeCn(
                        "p-4 rounded-md space-y-4 border",
                        colorCn("bg", categoryColor, "50", { dark: `${categoryColor}-950/20` }),
                        "border-slate-200 dark:border-slate-800",
                      )}
                    >
                      <h3
                        className={safeCn(
                          "font-medium",
                          colorCn("text", categoryColor, "800", { dark: `${categoryColor}-300` }),
                        )}
                      >
                        {category.name} Activities
                      </h3>

                      {/* Generate form fields for each metric in the category */}
                      {category.metrics.map((metric) => (
                        <MetricEntryField
                          key={`${category.id}_${metric.id}`}
                          category={category}
                          metric={metric}
                          form={form}
                          valueChangesRef={valueChangesRef}
                        />
                      ))}
                    </div>
                  )
                })
              )}

              {/* Additional categories section (only if we have more than 4 categories) */}
              {filteredCategories.length > 4 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Additional Categories</h3>

                  {filteredCategories.slice(4).map((category) => {
                    const categoryColor = getCategoryColorKey(category.id)

                    return (
                      <div
                        key={category.id}
                        className={safeCn(
                          "p-4 rounded-md space-y-4 mb-4 border",
                          colorCn("bg", categoryColor, "50", { dark: `${categoryColor}-950/20` }),
                          "border-slate-200 dark:border-slate-800",
                        )}
                      >
                        <h3
                          className={safeCn(
                            "font-medium",
                            colorCn("text", categoryColor, "800", { dark: `${categoryColor}-300` }),
                          )}
                        >
                          {category.name} Activities
                        </h3>

                        {/* Generate form fields for each metric in the category */}
                        {category.metrics.map((metric) => (
                          <MetricEntryField
                            key={`${category.id}_${metric.id}`}
                            category={category}
                            metric={metric}
                            form={form}
                            valueChangesRef={valueChangesRef}
                          />
                        ))}
                      </div>
                    )
                  })}
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  aria-label="Cancel entry form"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  aria-label={entryToEdit ? "Update entry" : "Save entry"}
                  formContext="entry"
                  categoryContext={categoryFilter || "all"}
                >
                  {entryToEdit ? "Update" : "Save"} Entry
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
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
  valueChangesRef: React.RefObject<HTMLDivElement>
}

function MetricEntryField({ category, metric, form, valueChangesRef }: MetricEntryFieldProps) {
  const fieldName = `${category.id}_${metric.id}` as any
  const fieldId = `${category.id}-${metric.id}`

  // Announce value changes to screen readers
  const announceValueChange = (value: number) => {
    if (valueChangesRef.current) {
      const unitLabel =
        metric.unit === "level" && metric.id === "stressLevel"
          ? getStressLevelLabel(value)
          : getUnitLabel(metric.unit, value)

      valueChangesRef.current.textContent = `${metric.name} set to ${value} ${unitLabel}`
    }
  }

  // Render different input types based on the metric unit
  if (metric.unit === "count") {
    return (
      <FormField
        control={form.control}
        name={fieldName}
        render={({ field }) => (
          <FormItem>
            <FormLabel htmlFor={fieldId}>{metric.name}</FormLabel>
            <FormControl>
              <Input
                id={fieldId}
                type="number"
                min={metric.min}
                max={metric.max}
                step={metric.step}
                value={field.value}
                onChange={(e) => {
                  const value = Number(e.target.value)
                  field.onChange(value)
                  announceValueChange(value)
                }}
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

  // For all other types, use a slider
  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => (
        <FormItem>
          <div className="flex justify-between">
            <FormLabel htmlFor={fieldId}>{metric.name}</FormLabel>
            <span className="text-sm">
              {metric.unit === "level" && metric.id === "stressLevel"
                ? `${field.value} - ${getStressLevelLabel(field.value)}`
                : getUnitLabel(metric.unit, field.value)}
            </span>
          </div>
          <FormControl>
            <Slider
              id={fieldId}
              min={metric.min}
              max={metric.max}
              step={metric.step}
              defaultValue={[field.value]}
              onValueChange={(values) => {
                if (values.length > 0) {
                  field.onChange(values[0])
                  announceValueChange(values[0])
                }
              }}
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
