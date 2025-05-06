"use client"

import type React from "react"
import type { ActivityFormData } from "@/types/forms"

import { useState, useEffect, useId } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { CharacterCounter } from "@/components/ui/character-counter"
import { FormErrorSummary } from "@/components/ui/form-error-summary"
import { FieldError } from "@/components/ui/field-error"
import { FormSubmissionFeedback } from "@/components/ui/form-submission-feedback"
import { validateActivityForm } from "@/utils/form-validation"
import { generateId } from "@/utils/id-generator"
import { useFormValidation } from "@/hooks/use-form-validation"

// DatePicker component
export function DatePicker({
  date,
  setDate,
  id,
  error,
}: {
  date: Date
  setDate: (date: Date) => void
  id: string
  error?: string
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            error && "border-destructive",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(date) => date && setDate(date)}
          initialFocus
          aria-label="Select date"
        />
      </PopoverContent>
      {error && <FieldError id={`${id}-error`} error={error} />}
    </Popover>
  )
}

export function ActivityForm() {
  const formId = useId()
  const [date, setDate] = useState<Date>(new Date())
  const [category, setCategory] = useState<string>("")
  const [duration, setDuration] = useState<number>(30)
  const [intensity, setIntensity] = useState<number[]>([3])
  const [notes, setNotes] = useState<string>("")
  const [reminder, setReminder] = useState<boolean>(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activities, setActivities] = useState<ActivityFormData[]>([])
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false)
  const [submissionStatus, setSubmissionStatus] = useState<"success" | "error" | null>(null)

  const { hasErrors } = useFormValidation({
    errors,
    isSubmitting,
    isSubmitted,
  })

  // Load saved activities from localStorage on component mount
  useEffect(() => {
    const savedActivities = localStorage.getItem("activities")
    if (savedActivities) {
      try {
        setActivities(JSON.parse(savedActivities))
      } catch (e) {
        console.error("Error parsing saved activities:", e)
        setActivities([])
      }
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setIsSubmitted(true)
    setSubmissionStatus(null)

    // Validate form
    const validationResult = validateActivityForm({
      category,
      duration,
      intensity: intensity[0],
      notes,
      date,
    })

    if (validationResult.errors) {
      setErrors(validationResult.errors)
      setIsSubmitting(false)
      return
    } else {
      setErrors({})
    }

    if (validationResult.valid) {
      // Simulate API call with timeout
      setTimeout(() => {
        try {
          // Create new activity
          const newActivity: ActivityFormData = {
            id: generateId(),
            title: category, // Using category as title for simplicity
            category,
            date,
            duration,
            intensity: intensity[0],
            notes,
            reminder,
          }

          // Add to activities list
          const updatedActivities = [...activities, newActivity]
          setActivities(updatedActivities)

          // Save to localStorage
          localStorage.setItem("activities", JSON.stringify(updatedActivities))

          // Reset form
          setCategory("")
          setDuration(30)
          setIntensity([3])
          setNotes("")
          setReminder(false)
          setIsSubmitted(false)

          // Show success message
          setSubmissionStatus("success")
        } catch (error) {
          console.error("Error saving activity:", error)
          setSubmissionStatus("error")
        } finally {
          setIsSubmitting(false)
        }
      }, 1000) // Simulate network delay
    } else {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Activity</CardTitle>
        <CardDescription>Record your wellness activities to track your progress over time.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6" id={formId} aria-label="Activity log form">
          <FormErrorSummary errors={errors} />
          <FormSubmissionFeedback
            status={submissionStatus}
            message={submissionStatus === "success" ? "Activity saved successfully!" : undefined}
          />

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`${formId}-date`}>Date</Label>
                <DatePicker date={date} setDate={setDate} id={`${formId}-date`} error={errors.date} />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-category`}>
                  Category{" "}
                  <span aria-hidden="true" className="text-destructive">
                    *
                  </span>
                  <span className="sr-only"> (required)</span>
                </Label>
                <Select value={category} onValueChange={setCategory} name="category">
                  <SelectTrigger
                    id={`${formId}-category`}
                    aria-invalid={!!errors.category}
                    aria-describedby={errors.category ? `${formId}-category-error` : undefined}
                    className={errors.category ? "border-destructive" : ""}
                  >
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exercise">Exercise</SelectItem>
                    <SelectItem value="meditation">Meditation</SelectItem>
                    <SelectItem value="reading">Reading</SelectItem>
                    <SelectItem value="nutrition">Nutrition</SelectItem>
                    <SelectItem value="sleep">Sleep</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="learning">Learning</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                  </SelectContent>
                </Select>
                {errors.category && <FieldError id={`${formId}-category-error`} error={errors.category} />}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`${formId}-duration`}>
                  Duration (minutes){" "}
                  <span aria-hidden="true" className="text-destructive">
                    *
                  </span>
                  <span className="sr-only"> (required)</span>
                </Label>
                <Input
                  id={`${formId}-duration`}
                  name="duration"
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(Number.parseInt(e.target.value) || 0)}
                  aria-invalid={!!errors.duration}
                  aria-describedby={errors.duration ? `${formId}-duration-error` : undefined}
                  className={errors.duration ? "border-destructive" : ""}
                />
                {errors.duration && <FieldError id={`${formId}-duration-error`} error={errors.duration} />}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-intensity`}>Intensity (1-5)</Label>
                <div className="pt-2">
                  <Slider
                    id={`${formId}-intensity`}
                    name="intensity"
                    min={1}
                    max={5}
                    step={1}
                    value={intensity}
                    onValueChange={setIntensity}
                    aria-valuemin={1}
                    aria-valuemax={5}
                    aria-valuenow={intensity[0]}
                    aria-valuetext={`Intensity level ${intensity[0]} out of 5`}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground" aria-hidden="true">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor={`${formId}-notes`}>Notes</Label>
                <CharacterCounter value={notes} maxLength={200} />
              </div>
              <Textarea
                id={`${formId}-notes`}
                name="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes about this activity..."
                maxLength={200}
                aria-invalid={!!errors.notes}
                aria-describedby={errors.notes ? `${formId}-notes-error` : undefined}
                className={errors.notes ? "border-destructive" : ""}
              />
              {errors.notes && <FieldError id={`${formId}-notes-error`} error={errors.notes} />}
            </div>

            <div className="flex items-center space-x-2">
              <Switch id={`${formId}-reminder`} name="reminder" checked={reminder} onCheckedChange={setReminder} />
              <Label htmlFor={`${formId}-reminder`} className="cursor-pointer">
                Set reminder for next time
              </Label>
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full" aria-busy={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="sr-only">Saving activity, please wait</span>
                <span aria-hidden="true">Saving...</span>
              </>
            ) : (
              "Save Activity"
            )}
          </Button>
        </form>
      </CardContent>

      {activities && activities.length > 0 && (
        <CardFooter className="flex flex-col">
          <h3 className="text-lg font-medium mb-2" id="recent-activities">
            Recent Activities
          </h3>
          <div className="w-full space-y-2" aria-labelledby="recent-activities">
            {activities
              .slice(-3)
              .reverse()
              .map((activity) => (
                <div key={activity.id} className="p-3 bg-muted rounded-md">
                  <div className="flex justify-between">
                    <span className="font-medium capitalize">{activity.category}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(activity.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-sm">
                    {activity.duration} minutes • Intensity: {activity.intensity}/5
                  </div>
                  {activity.notes && <div className="text-sm mt-1">{activity.notes}</div>}
                </div>
              ))}
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
