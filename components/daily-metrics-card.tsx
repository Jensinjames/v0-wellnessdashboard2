"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { WellnessMetric } from "@/types/supabase"
import { Loader2 } from "lucide-react"

interface DailyMetricsCardProps {
  userId: string
  metrics: WellnessMetric | null
}

export function DailyMetricsCard({ userId, metrics }: DailyMetricsCardProps) {
  const [motivationLevel, setMotivationLevel] = useState<number>(metrics?.motivation_level || 0)
  const [sleepHours, setSleepHours] = useState<number>(metrics?.sleep_hours || 0)
  const [dailyScore, setDailyScore] = useState<number>(metrics?.daily_score || 0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch("/api/wellness/update-metrics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          motivation_level: motivationLevel,
          sleep_hours: sleepHours,
          daily_score: dailyScore,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update metrics")
      }

      if (result.success) {
        setSuccess(true)
      }
    } catch (err) {
      console.error("Error updating metrics:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Metrics</CardTitle>
        <CardDescription>Track your daily wellness metrics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Motivation Level</span>
            <span className="text-sm text-muted-foreground">{motivationLevel}%</span>
          </div>
          <Slider
            value={[motivationLevel]}
            min={0}
            max={100}
            step={1}
            onValueChange={(value) => setMotivationLevel(value[0])}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Sleep Duration</span>
            <span className="text-sm text-muted-foreground">{sleepHours} hours</span>
          </div>
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              min={0}
              max={24}
              step={0.25}
              value={sleepHours}
              onChange={(e) => setSleepHours(Number.parseFloat(e.target.value) || 0)}
              className="h-9"
            />
            <span className="text-sm text-muted-foreground">hours</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Daily Score</span>
            <span className="text-sm text-muted-foreground">{dailyScore}%</span>
          </div>
          <Slider value={[dailyScore]} min={0} max={100} step={1} onValueChange={(value) => setDailyScore(value[0])} />
        </div>
        {success && (
          <div className="rounded-md bg-green-50 p-2 text-sm text-green-800 dark:bg-green-900 dark:text-green-50">
            Metrics updated successfully!
          </div>
        )}
        {error && (
          <div className="rounded-md bg-red-50 p-2 text-sm text-red-800 dark:bg-red-900 dark:text-red-50">{error}</div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Metrics"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
