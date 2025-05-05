"use client"

import type React from "react"
import type { ActivityFormData } from "@/types/forms"

import { useState, useEffect } from "react"
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
import { validateActivityForm } from "@/utils/form-validation"
import { generateId } from "@/utils/id-generator"

// DatePicker component
export function DatePicker({
  date,
  setDate,
}: {
  date: Date
  setDate: (date: Date) => void
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar mode="single" selected={date} onSelect={(date) => date && setDate(date)} initialFocus />
      </PopoverContent>
    </Popover>
  )
}

export function ActivityForm() {
  const [date, setDate] = useState<Date>(new Date())
  const [category, setCategory] = useState<string>("")
  const [duration, setDuration] = useState<number>(30)
  const [intensity, setIntensity] = useState<number[]>([3])
  const [notes, setNotes] = useState<string>("")
  const [reminder, setReminder] = useState<boolean>(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activities, setActivities] = useState<ActivityFormData[]>([])
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false)

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
    setSubmitSuccess(false)

    // Validate form
    const validationResult = validateActivityForm({
      category,
      duration,
      intensity: intensity[0],
      notes,
    })

    if (validationResult.errors) {
      setErrors(validationResult.errors)
    } else {
      setErrors({})
    }

    if (validationResult.valid) {
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

      // Show success message
      setSubmitSuccess(true)
    }

    setIsSubmitting(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Activity</CardTitle>
        <CardDescription>Record your wellness activities to track your progress over time.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {Object.keys(errors).length > 0 && <FormErrorSummary errors={errors} />}

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <DatePicker date={date} setDate={setDate} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category" aria-invalid={!!errors.category}>
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
                {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(Number.parseInt(e.target.value) || 0)}
                  aria-invalid={!!errors.duration}
                />
                {errors.duration && <p className="text-sm text-red-500">{errors.duration}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="intensity">Intensity (1-5)</Label>
                <div className="pt-2">
                  <Slider id="intensity" min={1} max={5} step={1} value={intensity} onValueChange={setIntensity} />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="notes">Notes</Label>
                <CharacterCounter value={notes} maxLength={200} />
              </div>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes about this activity..."
                maxLength={200}
                aria-invalid={!!errors.notes}
              />
              {errors.notes && <p className="text-sm text-red-500">{errors.notes}</p>}
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="reminder" checked={reminder} onCheckedChange={setReminder} />
              <Label htmlFor="reminder">Set reminder for next time</Label>
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Saving..." : "Save Activity"}
          </Button>

          {submitSuccess && (
            <div className="p-3 bg-green-50 text-green-700 rounded-md text-center">Activity saved successfully!</div>
          )}
        </form>
      </CardContent>

      {activities && activities.length > 0 && (
        <CardFooter className="flex flex-col">
          <h3 className="text-lg font-medium mb-2">Recent Activities</h3>
          <div className="w-full space-y-2">
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
