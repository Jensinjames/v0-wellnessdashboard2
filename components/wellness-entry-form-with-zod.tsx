"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

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
import { useWellness } from "@/context/wellness-context"
import { getUnitLabel, getStressLevelLabel } from "@/types/wellness"

export function WellnessEntryFormWithZod() {
  const { categories, addEntry } = useWellness()
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
      // Add ID if not present
      const entryData = {
        ...data,
        id: data.id || crypto.randomUUID(),
      }

      // Add entry to context
      addEntry(entryData)

      toast({
        title: "Entry saved",
        description: "Your wellness entry has been saved successfully.",
      })

      // Reset form
      form.reset(createDefaultValues())
    } catch (error) {
      console.error("Error submitting form:", error)

      toast({
        title: "Error",
        description: "There was an error saving your entry. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Wellness Entry</CardTitle>
        <CardDescription>Record your daily wellness metrics across all categories.</CardDescription>
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
                <div key={category.id} className={`bg-${category.color}-50 p-4 rounded-md space-y-4`}>
                  <h3 className={`font-medium text-${category.color}-800`}>{category.name}</h3>

                  {category.metrics.map((metric, metricIndex) => {
                    const fieldName = `metrics.${categoryIndex * category.metrics.length + metricIndex}.value` as const

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

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving..." : "Save Entry"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
