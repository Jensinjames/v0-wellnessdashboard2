"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { validateActivityForm } from "@/utils/form-validation"
import type { Activity } from "@/types/wellness"
import { generateId } from "@/utils/id-generator"

export function ActivityForm() {
  const [date, setDate] = useState<Date>(new Date())
  const [category, setCategory] = useState<string>("")
  const [duration, setDuration] = useState<number>(30)
  const [intensity, setIntensity] = useState<number[]>([3])
  const [notes, setNotes] = useState<string>("")
  const [reminder, setReminder] = useState<boolean>(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activities, setActivities] = useState<Activity[]>([])
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
    const validationErrors = validateActivityForm({ category, duration, intensity: intensity[0], notes })
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length === 0) {
      // Create new activity
      const newActivity: Activity = {
        id: generateId(),
        date: date.toISOString(),
        category,
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
      </CardHeader>
      <CardContent>
        <p className="mb-4">Activity form will be displayed here.</p>
        <Button>Save Activity</Button>
      </CardContent>
    </Card>
  )
}
