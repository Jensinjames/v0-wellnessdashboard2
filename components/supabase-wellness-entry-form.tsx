"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

import { wellnessEntryFormSchema, type WellnessEntryFormValues } from "@/schemas/wellness-entry-schemas"
import { useSupabaseWellness } from "@/context/supabase-wellness-context"
import { getUnitLabel, getStressLevelLabel } from "@/types/wellness"
import { createWellnessEntry } from "@/services/wellness-service"

export function SupabaseWellnessEntryForm() {
  const { categories, refreshData } = useSupabaseWellness()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const enabledCategories = categories.filter((cat) => cat.enabled)

  // Create default values for the form
  const createDefaultValues = (): WellnessEntryFormValues => {
    const metrics = enabledCategories.flatMap((category) =>
      category.metrics.map((metric) => ({
        categoryId: category.id,
        metricId: metric.id,
        value: metric.defaultValue,
      })),
    )

    return {
      date: new Date(),
      metrics,
      notes: "",
    }
  }

  // Initialize form with Zod resolver
  const form = useForm<WellnessEntryFormValues>({
    resolver: zodResolver(wellnessEntryFormSchema),
    defaultValues: createDefaultValues(),
  })

  // Form submission handler
  const onSubmit = async (data: WellnessEntryFormValues) => {
    try {
      setIsSubmitting(true)

      // Process each metric entry and save to Supabase
      const promises = data.metrics.map(async (metric) => {
        const category = enabledCategories.find((c) => c.id === metric.categoryId)
        const metricDef = category?.metrics.find((m) => m.id === metric.metricId)

        if (!category || !metricDef) {
          console.error("Category or metric not found", metric)
          return
        }

        // Create entry in Supabase
        await createWellnessEntry({
          category: category.name,
          activity: metricDef.name,
          duration: metric.value,
          notes: data.notes || undefined,
        })
      })

      // Wait for all entries to be saved
      await Promise.all(promises)

      // Refresh data to show new entries
      await refreshData()

      toast({
        title: "Entry saved to Supabase",
        description: "Your wellness entry has been saved successfully to the database.",
      })

      // Reset form
      form.reset(createDefaultValues())
    } catch (error) {
      console.error("Error submitting form to Supabase:", error)

      toast({
        title: "Database Error",
        description: "There was an error saving your entry to the database. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Wellness Entry</CardTitle>
        <CardDescription>Record your daily wellness metrics and save them to Supabase.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              {enabledCategories.map((category, categoryIndex) => (
                <div key={category.id} className="bg-gray-50 border border-gray-200 p-4 rounded-md space-y-4">
                  <h3 className="font-medium text-gray-800 flex items-center gap-2">{category.name}</h3>

                  {category.metrics.map((metric, metricIndex) => {
                    const fieldIndex =
                      enabledCategories.slice(0, categoryIndex).reduce((acc, cat) => acc + cat.metrics.length, 0) +
                      metricIndex

                    const fieldName = `metrics.${fieldIndex}.value` as const

                    return (
                      <FormField
                        key={metric.id}
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
                              {metric.unit === "count" ? (
                                <input
                                  type="number"
                                  min={metric.min}
                                  max={metric.max}
                                  step={metric.step}
                                  value={field.value}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                  className="w-full p-2 border rounded"
                                />
                              ) : (
                                <Slider
                                  min={metric.min}
                                  max={metric.max}
                                  step={metric.step}
                                  value={[field.value]}
                                  onValueChange={(value) => field.onChange(value[0])}
                                  className="py-4"
                                />
                              )}
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )
                  })}
                </div>
              ))}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes about your wellness today..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Add any relevant details about your wellness today</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving to Database...
                </>
              ) : (
                "Save Entry to Supabase"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
