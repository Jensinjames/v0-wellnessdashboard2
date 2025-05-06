"use client"

import type React from "react"

import { useState, useId } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Settings } from "lucide-react"
import * as LucideIcons from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { FormErrorSummary } from "@/components/ui/form-error-summary"
import { FormSubmissionFeedback } from "@/components/ui/form-submission-feedback"
import { useWellness } from "@/context/wellness-context"
import { useFormValidation } from "@/hooks/use-form-validation"
import {
  type WellnessCategory,
  type WellnessGoal,
  type WellnessMetric,
  getUnitLabel,
  getStressLevelLabel,
} from "@/types/wellness"

export function GoalSettingForm() {
  const formId = useId()
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("faith")
  const { categories, goals, updateGoals, updateCategory } = useWellness()
  const [submissionStatus, setSubmissionStatus] = useState<"success" | "error" | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Create a dynamic form schema based on categories
  const createFormSchema = () => {
    const schemaFields: Record<string, any> = {}

    // Add enabled fields for each category
    categories.forEach((category) => {
      schemaFields[`${category.id}Enabled`] = z.boolean().default(category.enabled)

      // Add goal fields for each metric in the category
      category.metrics.forEach((metric) => {
        schemaFields[`${category.id}_${metric.id}_goal`] = z
          .number({
            required_error: `Goal for ${metric.name} is required`,
            invalid_type_error: `Goal for ${metric.name} must be a number`,
          })
          .min(metric.min, {
            message: `Goal for ${metric.name} must be at least ${metric.min}`,
          })
          .max(metric.max, {
            message: `Goal for ${metric.name} cannot exceed ${metric.max}`,
          })
          .default(
            goals.find((g) => g.categoryId === category.id && g.metricId === metric.id)?.value || metric.defaultGoal,
          )
      })
    })

    return z.object(schemaFields)
  }

  const formSchema = createFormSchema()
  type FormValues = z.infer<typeof formSchema>

  // Initialize form with current values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
  })

  const { formState } = form
  const { hasErrors } = useFormValidation({
    errors: formState.errors,
    isSubmitting,
    isSubmitted: formState.isSubmitted,
  })

  // Get default values from current goals and categories
  function getDefaultValues(): Partial<FormValues> {
    const values: Record<string, any> = {}

    categories.forEach((category) => {
      values[`${category.id}Enabled`] = category.enabled

      category.metrics.forEach((metric) => {
        const goal = goals.find((g) => g.categoryId === category.id && g.metricId === metric.id)
        values[`${category.id}_${metric.id}_goal`] = goal?.value || metric.defaultGoal
      })
    })

    return values
  }

  // Form submission handler
  function onSubmit(data: FormValues) {
    setIsSubmitting(true)
    setSubmissionStatus(null)

    try {
      // Update category enabled states
      categories.forEach((category) => {
        const enabledKey = `${category.id}Enabled` as keyof FormValues
        const isEnabled = data[enabledKey] as boolean

        if (isEnabled !== category.enabled) {
          updateCategory(category.id, { enabled: isEnabled })
        }
      })

      // Update goals
      const updatedGoals: WellnessGoal[] = []

      categories.forEach((category) => {
        category.metrics.forEach((metric) => {
          const goalKey = `${category.id}_${metric.id}_goal` as keyof FormValues
          const goalValue = data[goalKey] as number

          updatedGoals.push({
            categoryId: category.id,
            metricId: metric.id,
            value: goalValue,
          })
        })
      })

      updateGoals(updatedGoals)

      // Show success message
      setSubmissionStatus("success")
      toast({
        title: "Goals updated successfully",
        description: "Your wellness goals have been saved.",
      })

      // Close the dialog after a short delay
      setTimeout(() => {
        setOpen(false)
        setSubmissionStatus(null)
      }, 1500)
    } catch (error) {
      console.error("Error updating goals:", error)
      setSubmissionStatus("error")
      toast({
        title: "Error updating goals",
        description: "There was a problem saving your goals. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get icon component by name
  const getIconByName = (name: string) => {
    const Icon = (LucideIcons as Record<string, React.ComponentType<any>>)[name] || Settings
    return <Icon className="h-5 w-5" aria-hidden="true" />
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
          Set Wellness Goals
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Set Your Wellness Goals</DialogTitle>
          <DialogDescription>
            Customize your wellness goals for each category. These goals will be used to track your progress.
          </DialogDescription>
        </DialogHeader>

        <FormSubmissionFeedback
          status={submissionStatus}
          message={submissionStatus === "success" ? "Goals updated successfully!" : undefined}
        />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" id={formId} aria-label="Goal setting form">
            <FormErrorSummary errors={form.formState.errors} />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 mb-4">
                {categories.slice(0, 4).map((category) => (
                  <TabsTrigger key={category.id} value={category.id}>
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Generate tab content for each category */}
              {categories.map((category) => (
                <TabsContent key={category.id} value={category.id} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getIconByName(category.icon)}
                      <h3 className="text-lg font-medium" id={`${category.id}-heading`}>
                        {category.name} Goals
                      </h3>
                    </div>
                    <FormField
                      control={form.control}
                      name={`${category.id}Enabled` as any}
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormLabel htmlFor={`${formId}-${category.id}-enabled`} className="cursor-pointer">
                            Enable
                          </FormLabel>
                          <FormControl>
                            <Switch
                              id={`${formId}-${category.id}-enabled`}
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              aria-describedby={`${category.id}-heading`}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  {/* Generate form fields for each metric in the category */}
                  {category.metrics.map((metric) => (
                    <MetricGoalField
                      key={`${category.id}_${metric.id}`}
                      category={category}
                      metric={metric}
                      form={form}
                      formId={formId}
                    />
                  ))}
                </TabsContent>
              ))}
            </Tabs>

            {/* Additional categories section */}
            {categories.length > 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Additional Categories</h3>
                <Separator />

                {categories.slice(4).map((category) => (
                  <div key={category.id} className="space-y-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getIconByName(category.icon)}
                        <h4 className="font-medium" id={`${category.id}-heading`}>
                          {category.name}
                        </h4>
                      </div>
                      <FormField
                        control={form.control}
                        name={`${category.id}Enabled` as any}
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormLabel htmlFor={`${formId}-${category.id}-enabled`} className="cursor-pointer">
                              Enable
                            </FormLabel>
                            <FormControl>
                              <Switch
                                id={`${formId}-${category.id}-enabled`}
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                aria-describedby={`${category.id}-heading`}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Generate form fields for each metric in the category */}
                    {category.metrics.map((metric) => (
                      <MetricGoalField
                        key={`${category.id}_${metric.id}`}
                        category={category}
                        metric={metric}
                        form={form}
                        formId={formId}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="sr-only">Saving goals, please wait</span>
                    <span aria-hidden="true">Saving...</span>
                  </>
                ) : (
                  "Save Goals"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// Component for rendering a metric goal field
interface MetricGoalFieldProps {
  category: WellnessCategory
  metric: WellnessMetric
  form: any
  formId: string
}

function MetricGoalField({ category, metric, form, formId }: MetricGoalFieldProps) {
  const fieldName = `${category.id}_${metric.id}_goal` as any
  const isEnabled = form.watch(`${category.id}Enabled`)
  const fieldId = `${formId}-${category.id}-${metric.id}-goal`
  const hasError = !!form.formState.errors[fieldName]

  // Render different input types based on the metric unit
  if (metric.unit === "count") {
    return (
      <FormField
        control={form.control}
        name={fieldName}
        render={({ field }) => (
          <FormItem>
            <FormLabel htmlFor={fieldId}>
              {metric.name} Goal
              {!isEnabled && <span className="sr-only"> (disabled)</span>}
            </FormLabel>
            <FormControl>
              <Input
                id={fieldId}
                type="number"
                min={metric.min}
                max={metric.max}
                step={metric.step}
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
                disabled={!isEnabled}
                aria-invalid={hasError}
                aria-describedby={hasError ? `${fieldId}-error` : `${fieldId}-description`}
              />
            </FormControl>
            <FormDescription id={`${fieldId}-description`}>{metric.description}</FormDescription>
            <FormMessage id={`${fieldId}-error`} />
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
            <FormLabel htmlFor={fieldId}>
              {metric.name} Goal
              {!isEnabled && <span className="sr-only"> (disabled)</span>}
            </FormLabel>
            <span className="text-sm" aria-live="polite" aria-atomic="true">
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
              value={[field.value]}
              onValueChange={(value) => field.onChange(value[0])}
              disabled={!isEnabled}
              aria-valuemin={metric.min}
              aria-valuemax={metric.max}
              aria-valuenow={field.value}
              aria-valuetext={
                metric.unit === "level" && metric.id === "stressLevel"
                  ? `${field.value} - ${getStressLevelLabel(field.value)}`
                  : getUnitLabel(metric.unit, field.value)
              }
              aria-invalid={hasError}
              aria-describedby={hasError ? `${fieldId}-error` : `${fieldId}-description`}
            />
          </FormControl>
          <FormDescription id={`${fieldId}-description`}>{metric.description}</FormDescription>
          <FormMessage id={`${fieldId}-error`} />
        </FormItem>
      )}
    />
  )
}
