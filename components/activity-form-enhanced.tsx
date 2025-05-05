"use client"

import type React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

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
import { CharacterCounter } from "@/components/ui/character-counter"
import { FormErrorSummary } from "@/components/ui/form-error-summary"
import { FormSubmissionFeedback } from "@/components/ui/form-submission-feedback"
import { cn } from "@/lib/utils"
import { useActivityForm } from "@/hooks/use-activity-form"
import { getAriaAttributes } from "@/utils/form-error-utils"

export function ActivityFormEnhanced() {
  const { formData, handleChange, submit, isSubmitting, isSuccess, errors, result, loadActivities } = useActivityForm({
    onSuccess: () => {
      // You could add additional success handling here
      console.log("Activity saved successfully")
    },
  })

  const activities = loadActivities()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submit(formData)
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.date && "text-muted-foreground",
                      )}
                      {...getAriaAttributes("date", errors)}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => date && handleChange("date", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.date && (
                  <p className="text-sm text-red-500" id="date-error">
                    {errors.date}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
                  <SelectTrigger id="category" {...getAriaAttributes("category", errors)}>
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
                {errors.category && (
                  <p className="text-sm text-red-500" id="category-error">
                    {errors.category}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) => handleChange("duration", Number(e.target.value) || 0)}
                  {...getAriaAttributes("duration", errors)}
                />
                {errors.duration && (
                  <p className="text-sm text-red-500" id="duration-error">
                    {errors.duration}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="intensity">Intensity (1-5)</Label>
                <div className="pt-2">
                  <Slider
                    id="intensity"
                    min={1}
                    max={5}
                    step={1}
                    value={[formData.intensity]}
                    onValueChange={(value) => handleChange("intensity", value[0])}
                    {...getAriaAttributes("intensity", errors)}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                </div>
                {errors.intensity && (
                  <p className="text-sm text-red-500" id="intensity-error">
                    {errors.intensity}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="notes">Notes</Label>
                <CharacterCounter value={formData.notes || ""} maxLength={200} />
              </div>
              <Textarea
                id="notes"
                value={formData.notes || ""}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Add any additional notes about this activity..."
                maxLength={200}
                {...getAriaAttributes("notes", errors)}
              />
              {errors.notes && (
                <p className="text-sm text-red-500" id="notes-error">
                  {errors.notes}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="reminder"
                checked={formData.reminder || false}
                onCheckedChange={(checked) => handleChange("reminder", checked)}
              />
              <Label htmlFor="reminder">Set reminder for next time</Label>
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Saving..." : "Save Activity"}
          </Button>

          {(isSubmitting || result) && (
            <FormSubmissionFeedback isSubmitting={isSubmitting} isSuccess={isSuccess} message={result?.message} />
          )}
        </form>
      </CardContent>

      {activities.length > 0 && (
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
