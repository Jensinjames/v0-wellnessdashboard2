"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { createWellnessEntry } from "@/services/wellness-service"
import { useRealtimeWellness } from "@/context/realtime-wellness-context"
import { getUnitLabel } from "@/types/wellness"

// Create a schema for the form
const formSchema = z.object({
  date: z.date({
    required_error: "A date is required.",
  }),
  notes: z.string().optional(),
  metrics: z.record(z.record(z.number())),
})

type FormValues = z.infer<typeof formSchema>

export function RealtimeWellnessEntryForm() {
  const { categories, refreshData } = useRealtimeWellness()
  const [activeTab, setActiveTab] = useState(categories[0]?.id || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Set up the form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      notes: "",
      metrics: categories.reduce(
        (acc, category) => {
          acc[category.id] = category.metrics.reduce(
            (metricAcc, metric) => {
              metricAcc[metric.id] = metric.defaultValue
              return metricAcc
            },
            {} as Record<string, number>,
          )
          return acc
        },
        {} as Record<string, Record<string, number>>,
      ),
    },
  })

  async function onSubmit(data: FormValues) {
    try {
      setIsSubmitting(true)

      // Create an array of promises for each entry
      const entryPromises: Promise<void>[] = []

      // For each category and metric, create a separate entry
      for (const categoryId in data.metrics) {
        const category = categories.find((c) => c.id === categoryId)
        if (!category) continue

        for (const metricId in data.metrics[categoryId]) {
          const metric = category.metrics.find((m) => m.id === metricId)
          if (!metric) continue

          const value = data.metrics[categoryId][metricId]

          // Create entry for this metric
          entryPromises.push(
            createWellnessEntry({
              category: category.name,
              activity: metric.name,
              duration: value,
              notes: data.notes,
            }),
          )
        }
      }

      // Wait for all entries to be created
      await Promise.all(entryPromises)

      // Show success message
      toast({
        title: "Entry saved!",
        description: `Your wellness entry for ${format(data.date, "PPP")} has been saved.`,
      })

      // No need to manually refresh data since we're using real-time subscriptions!
      // The UI will update automatically when the database changes

      // Reset form
      form.reset({
        date: new Date(),
        notes: "",
        metrics: categories.reduce(
          (acc, category) => {
            acc[category.id] = category.metrics.reduce(
              (metricAcc, metric) => {
                metricAcc[metric.id] = metric.defaultValue
                return metricAcc
              },
              {} as Record<string, number>,
            )
            return acc
          },
          {} as Record<string, Record<string, number>>,
        ),
      })
    } catch (error) {
      console.error("Error saving entry:", error)
      toast({
        title: "Error saving entry",
        description: "There was a problem saving your entry. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Add Wellness Entry</CardTitle>
            <CardDescription>Track your daily wellness metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                          className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
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

            <div className="space-y-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4">
                  {categories.map((category) => (
                    <TabsTrigger key={category.id} value={category.id}>
                      {category.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {categories.map((category) => (
                  <TabsContent key={category.id} value={category.id} className="space-y-4">
                    <div className="grid gap-4">
                      {category.metrics.map((metric) => (
                        <FormField
                          key={metric.id}
                          control={form.control}
                          name={`metrics.${category.id}.${metric.id}`}
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex justify-between">
                                <FormLabel>{metric.name}</FormLabel>
                                <span className="text-sm text-muted-foreground">
                                  {getUnitLabel(metric.unit, field.value)}
                                </span>
                              </div>
                              <FormControl>
                                <div className="flex items-center gap-4">
                                  <Slider
                                    min={metric.min}
                                    max={metric.max}
                                    step={metric.step}
                                    value={[field.value]}
                                    onValueChange={(value) => field.onChange(value[0])}
                                    className="flex-1"
                                  />
                                  <Input
                                    type="number"
                                    value={field.value}
                                    onChange={(e) => {
                                      const value = Number.parseFloat(e.target.value)
                                      if (!isNaN(value)) {
                                        field.onChange(value)
                                      }
                                    }}
                                    min={metric.min}
                                    max={metric.max}
                                    step={metric.step}
                                    className="w-20"
                                  />
                                </div>
                              </FormControl>
                              {metric.description && <FormDescription>{metric.description}</FormDescription>}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add any notes about your day..." className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Entry"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}
