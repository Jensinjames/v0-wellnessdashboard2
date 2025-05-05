"use client"

import { useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { activityFormSchema, type ActivityFormValues } from "@/schemas/activity-form-schemas"
import { createActivity } from "@/actions/activity-actions"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { FormSubmissionFeedback } from "@/components/ui/form-submission-feedback"
import { FormErrorSummary } from "@/components/ui/form-error-summary"

interface ActivityFormProps {
  categories: { id: string; name: string }[]
}

export function ActivityFormWithServerValidation({ categories }: ActivityFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [serverErrors, setServerErrors] = useState<Record<string, string[]> | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Default values for the form
  const defaultValues: Partial<ActivityFormValues> = {
    title: "",
    notes: "",
    duration: 30,
  }

  // Initialize form with React Hook Form and Zod resolver
  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues,
  })

  // Handle form submission
  async function onSubmit(data: ActivityFormValues) {
    setIsSubmitting(true)
    setIsSuccess(false)
    setServerErrors(null)

    try {
      // Create FormData from the form
      const formData = new FormData(formRef.current!)

      // Call server action
      const result = await createActivity(formData)

      if (result.fieldErrors) {
        // Handle validation errors from server
        setServerErrors(result.fieldErrors)

        // Set form errors
        Object.entries(result.fieldErrors).forEach(([field, errors]) => {
          form.setError(field as any, {
            type: "server",
            message: errors[0],
          })
        })

        toast({
          title: "Validation Error",
          description: "Please correct the errors in the form.",
          variant: "destructive",
        })
      } else if (result.error) {
        // Handle other errors
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        // Success
        toast({
          title: "Activity added",
          description: "Your activity has been successfully recorded.",
        })

        // Reset form
        form.reset(defaultValues)
        setIsSuccess(true)
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {serverErrors && <FormErrorSummary errors={serverErrors} />}

        <FormField
          control={form.control}
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
          control={form.control}
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
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (minutes)</FormLabel>
              <FormControl>
                <Input type="number" {...field} onChange={(e) => field.onChange(Number.parseInt(e.target.value))} />
              </FormControl>
              <FormDescription>How long did you spend on this activity?</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
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
