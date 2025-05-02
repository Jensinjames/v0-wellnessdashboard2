"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { CharacterCounter } from "@/components/ui/character-counter"
import { FormErrorSummary } from "@/components/ui/form-error-summary"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { createInterdependentFormSchema } from "@/utils/interdependent-validation"

// Define the category template type
type CategoryTemplate = {
  id: string
  name: string
  description: string
  subcategories: string[]
  defaultGoal?: number
  unit?: string
  minValue?: number
  maxValue?: number
}

// Sample categories for demonstration
const categories: CategoryTemplate[] = [
  {
    id: "exercise",
    name: "Exercise",
    description: "Physical activities to improve fitness",
    subcategories: ["Cardio", "Strength", "Flexibility", "Sports"],
    defaultGoal: 30,
    unit: "minutes",
    minValue: 0,
    maxValue: 240,
  },
  {
    id: "nutrition",
    name: "Nutrition",
    description: "Dietary habits and food intake",
    subcategories: ["Meals", "Hydration", "Supplements"],
    defaultGoal: 2000,
    unit: "calories",
    minValue: 0,
    maxValue: 5000,
  },
  {
    id: "sleep",
    name: "Sleep",
    description: "Sleep duration and quality",
    subcategories: ["Duration", "Quality"],
    defaultGoal: 8,
    unit: "hours",
    minValue: 0,
    maxValue: 12,
  },
  {
    id: "mindfulness",
    name: "Mindfulness",
    description: "Mental wellness activities",
    subcategories: ["Meditation", "Breathing", "Journaling"],
    defaultGoal: 15,
    unit: "minutes",
    minValue: 0,
    maxValue: 120,
  },
]

// Create the form schema
const formSchema = z.object({
  category: z.string({
    required_error: "Please select a category",
  }),
  subcategory: z.string({
    required_error: "Please select a subcategory",
  }),
  date: z.date({
    required_error: "Please select a date",
  }),
  duration: z
    .number({
      required_error: "Please enter a duration",
    })
    .min(0, {
      message: "Duration must be at least 0",
    }),
  value: z
    .number({
      required_error: "Please enter a value",
    })
    .min(0, {
      message: "Value must be at least 0",
    }),
  notes: z
    .string()
    .max(500, {
      message: "Notes must be 500 characters or less",
    })
    .optional(),
})

// Create the interdependent form schema
const activityFormSchema = createInterdependentFormSchema(formSchema, (data) => {
  const category = categories.find((c) => c.id === data.category)
  const validations = []

  if (category) {
    // Validate that subcategory is valid for the selected category
    if (!category.subcategories.includes(data.subcategory)) {
      validations.push({
        path: ["subcategory"],
        message: `${data.subcategory} is not a valid subcategory for ${category.name}`,
        type: "warning",
      })
    }

    // Validate that duration is within reasonable limits
    if (data.duration > category.maxValue!) {
      validations.push({
        path: ["duration"],
        message: `Duration exceeds the maximum of ${category.maxValue} ${category.unit} for ${category.name}`,
        type: "warning",
      })
    }

    // Validate that value is within reasonable limits
    if (data.value > category.maxValue!) {
      validations.push({
        path: ["value"],
        message: `Value exceeds the maximum of ${category.maxValue} for ${category.name}`,
        type: "warning",
      })
    }
  }

  return validations
})

// Define the form values type
type FormValues = z.infer<typeof formSchema>

export function ActivityForm() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryTemplate | null>(null)
  const [statusMessage, setStatusMessage] = useState("")

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      category: "",
      subcategory: "",
      date: new Date(),
      duration: 0,
      value: 0,
      notes: "",
    },
  })

  // Watch for category changes
  const watchedCategory = form.watch("category")

  // Update selected category when the form value changes
  useEffect(() => {
    const category = categories.find((c) => c.id === watchedCategory)
    setSelectedCategory(category || null)

    // Reset subcategory when category changes
    if (category) {
      form.setValue("subcategory", category.subcategories[0])
      form.setValue("duration", category.defaultGoal || 0)
      form.setValue("value", category.defaultGoal || 0)
    }
  }, [watchedCategory, form])

  // Handle form submission
  function onSubmit(data: FormValues) {
    console.log("Form submitted:", data)
    // Here you would typically save the data to your state or API

    // Show success message
    setStatusMessage("Activity logged successfully!")

    // Clear the message after 3 seconds
    setTimeout(() => {
      setStatusMessage("")
    }, 3000)

    // Reset form
    form.reset({
      category: "",
      subcategory: "",
      date: new Date(),
      duration: 0,
      value: 0,
      notes: "",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Log Activity</h2>
        <p className="text-muted-foreground">Record your wellness activities to track your progress</p>
      </div>

      {statusMessage && (
        <div
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative"
          role="alert"
          aria-live="polite"
        >
          {statusMessage}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormErrorSummary form={form} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Field */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <select className="w-full p-2 border border-input rounded-md" {...field}>
                      <option value="" disabled>
                        Select a category
                      </option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormDescription>Select the wellness category</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Subcategory Field */}
            <FormField
              control={form.control}
              name="subcategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subcategory</FormLabel>
                  <FormControl>
                    <select
                      className="w-full p-2 border border-input rounded-md"
                      {...field}
                      disabled={!selectedCategory}
                    >
                      <option value="" disabled>
                        Select a subcategory
                      </option>
                      {selectedCategory?.subcategories.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormDescription>Select the specific activity type</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date Field */}
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
                  <FormDescription>When did you perform this activity?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Duration Field */}
            <FormField
              control={form.control}
              name="duration"
              render={({ field: { onChange, value, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Duration ({selectedCategory?.unit || "units"})</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <Slider
                        min={0}
                        max={selectedCategory?.maxValue || 100}
                        step={1}
                        value={[value]}
                        onValueChange={(vals) => onChange(vals[0])}
                        disabled={!selectedCategory}
                      />
                      <Input
                        type="number"
                        onChange={(e) => onChange(Number(e.target.value))}
                        value={value}
                        {...fieldProps}
                        disabled={!selectedCategory}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>How long did you perform this activity?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Value Field */}
            <FormField
              control={form.control}
              name="value"
              render={({ field: { onChange, value, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Value</FormLabel>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <FormControl>
                          <Input
                            type="number"
                            onChange={(e) => onChange(Number(e.target.value))}
                            value={value}
                            {...fieldProps}
                            disabled={!selectedCategory}
                          />
                        </FormControl>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>For example: calories, steps, weight, etc.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <FormDescription>Enter the measured value for this activity</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes Field */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="col-span-1 md:col-span-2">
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Textarea
                        placeholder="Add any additional notes or observations"
                        className="min-h-[100px] resize-y"
                        {...field}
                      />
                      <CharacterCounter
                        value={field.value || ""}
                        maxLength={500}
                        className="absolute bottom-2 right-2 text-xs text-muted-foreground"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>Optional details about your activity</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={!selectedCategory}>
              Log Activity
            </Button>
          </div>

          <VisuallyHidden aria-live="polite">{statusMessage}</VisuallyHidden>
        </form>
      </Form>
    </div>
  )
}
