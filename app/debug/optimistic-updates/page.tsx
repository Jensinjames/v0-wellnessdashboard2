"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OptimisticUpdatesMonitor } from "@/components/debug/optimistic-updates-monitor"
import { useOptimisticWellness } from "@/hooks/use-optimistic-wellness"
import { addEntry } from "@/app/actions/entry-actions"
import { useAuth } from "@/context/auth-context"

export default function OptimisticUpdatesPage() {
  const { user } = useAuth()
  const [activity, setActivity] = useState("Test Activity")
  const [duration, setDuration] = useState("1")
  const [delay, setDelay] = useState("2")
  const [message, setMessage] = useState("")
  const [isSuccess, setIsSuccess] = useState(true)
  const { addOptimisticEntry, confirmUpdate, failUpdate } = useOptimisticWellness()

  // Example optimistic update test function
  const testOptimisticUpdate = async () => {
    if (!user) {
      setMessage("You must be logged in to test optimistic updates")
      setIsSuccess(false)
      return
    }

    setMessage("Creating optimistic update...")
    setIsSuccess(true)

    // Create optimistic entry
    const optimisticEntry = addOptimisticEntry({
      user_id: user.id,
      category: "2f5b9930-defa-432b-babd-c3b1450820aa", // Default category ID - you may need to adjust this
      activity: activity,
      duration: Number.parseFloat(duration),
      notes: "This is a test entry created with optimistic updates",
      timestamp: new Date().toISOString(),
    })

    setMessage(`Optimistic entry created with ID: ${optimisticEntry.id}. Waiting ${delay} seconds...`)

    try {
      // Simulate server delay
      await new Promise((resolve) => setTimeout(resolve, Number.parseInt(delay) * 1000))

      // Submit to the server
      const result = await addEntry({
        category: "2f5b9930-defa-432b-babd-c3b1450820aa", // Default category ID
        activity: activity,
        duration: Number.parseFloat(duration),
        notes: "This is a test entry created with optimistic updates",
      })

      if (result.success) {
        confirmUpdate(optimisticEntry.id, result.data)
        setMessage(`Success! Server confirmed the update with ID: ${result.data?.id || "unknown"}`)
        setIsSuccess(true)
      } else {
        failUpdate(optimisticEntry.id, new Error(result.error))
        setMessage(`Error: ${result.error}`)
        setIsSuccess(false)
      }
    } catch (error) {
      failUpdate(optimisticEntry.id, error instanceof Error ? error : new Error("Unknown error"))
      setMessage(`Exception: ${error instanceof Error ? error.message : "Unknown error"}`)
      setIsSuccess(false)
    }
  }

  // Test a failed update
  const testFailedUpdate = async () => {
    if (!user) {
      setMessage("You must be logged in to test optimistic updates")
      setIsSuccess(false)
      return
    }

    setMessage("Creating optimistic update that will fail...")
    setIsSuccess(true)

    // Create optimistic entry
    const optimisticEntry = addOptimisticEntry({
      user_id: user.id,
      category: "invalid-category-id", // This will cause the server action to fail
      activity: activity,
      duration: Number.parseFloat(duration),
      notes: "This is a test entry that should fail",
      timestamp: new Date().toISOString(),
    })

    setMessage(`Optimistic entry created with ID: ${optimisticEntry.id}. Waiting ${delay} seconds...`)

    try {
      // Simulate server delay
      await new Promise((resolve) => setTimeout(resolve, Number.parseInt(delay) * 1000))

      // Submit to the server with invalid data to force a failure
      const result = await addEntry({
        category: "invalid-category-id", // This ID doesn't exist
        activity: activity,
        duration: Number.parseFloat(duration),
        notes: "This is a test entry that should fail",
      })

      // This should fail so we'll handle the error
      failUpdate(optimisticEntry.id, new Error(result.error))
      setMessage(`As expected, the server rejected the update: ${result.error}`)
      setIsSuccess(false)
    } catch (error) {
      failUpdate(optimisticEntry.id, error instanceof Error ? error : new Error("Unknown error"))
      setMessage(`Exception: ${error instanceof Error ? error.message : "Unknown error"}`)
      setIsSuccess(false)
    }
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Optimistic Updates Debug</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Test Optimistic Updates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="activity">Activity Name</Label>
                <Input
                  id="activity"
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                  placeholder="Enter activity name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (hours)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="0.25"
                  step="0.25"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="delay">Simulated Server Delay (seconds)</Label>
                <Input
                  id="delay"
                  type="number"
                  min="0"
                  max="10"
                  value={delay}
                  onChange={(e) => setDelay(e.target.value)}
                />
              </div>

              <div className="space-y-4 pt-4">
                <Button onClick={testOptimisticUpdate} className="mr-4">
                  Test Successful Update
                </Button>
                <Button onClick={testFailedUpdate} variant="destructive">
                  Test Failed Update
                </Button>
              </div>

              {message && (
                <div
                  className={`p-4 border rounded-md ${isSuccess ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}
                >
                  {message}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <OptimisticUpdatesMonitor />
        </div>
      </div>
    </div>
  )
}
