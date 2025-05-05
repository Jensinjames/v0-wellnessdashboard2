"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useFormAnalytics } from "@/hooks/use-form-analytics"
import { FormSubmissionFeedback } from "@/components/ui/form-submission-feedback"

// Form schema
const activityFormSchema = z.object({
  title: z
    .string()
    .min(3, {
      message: "Title must be at least 3 characters.",
    })
    .max(50, {
      message: "Title must not exceed 50 characters.",
    }),
  category: z.string({
    required_error: "Please select a category.",
  }),
  duration: z.coerce
    .number()
    .min(1, {
      message: "Duration must be at least 1 minute.",
    })
    .max(1440, {
      message: "Duration must not exceed 24 hours (1440 minutes).",
    }),
  notes: z
    .string()
    .max(500, {
      message: "Notes must not exceed 500 characters.",
    })
    .optional(),
})

type ActivityFormValues = z.infer<typeof activityFormSchema>

const defaultValues: Partial<ActivityFormValues> = {
  title: "",
  notes: "",
  duration: 30,
}

interface ActivityFormProps {
  onSubmit?: (data: ActivityFormValues) => void
  categories: { id: string; name: string }[]
}

export function ActivityFormWithAnalytics({ onSubmit, categories }: ActivityFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Create form with React Hook Form
  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues,
  })

  // Wrap with analytics
  const formWithAnalytics = useFormAnalytics(form, {
    formId: "activity-form",
    onSubmit: async (data) => {
      setIsSubmitting(true)
      setIsSuccess(false)

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Call the provided onSubmit handler
        if (onSubmit) {
          onSubmit(data)
        }

        // Show success message
        toast({
          title: "Activity added",
          description: "Your activity has been successfully recorded.",
        })

        // Reset form
        form.reset(defaultValues)
        setIsSuccess(true)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to add activity. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  return (
    <Form {...formWithAnalytics}>
      <form onSubmit={formWithAnalytics.handleSubmit()} className="space-y-6">
        <FormField
          control={formWithAnalytics.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Activity Title</FormLabel>
              <FormControl>
                <Input placeholder="Morning Yoga" {...field} />
              </FormControl>
              <FormDescription>Enter a descriptive name for your activity.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={formWithAnalytics.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
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
              <FormDescription>Select the category that best fits this activity.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={formWithAnalytics.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (minutes)</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormDescription>How long did you spend on this activity?</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={formWithAnalytics.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any additional details about this activity..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>Optional notes about your activity.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormSubmissionFeedback isSubmitting={isSubmitting} isSuccess={isSuccess} />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding Activity..." : "Add Activity"}
        </Button>
      </form>
    </Form>
  )
}
