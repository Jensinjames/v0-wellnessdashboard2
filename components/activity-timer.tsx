"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Move formatDuration to module level so it can be properly exported
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  return [
    hours.toString().padStart(2, "0"),
    minutes.toString().padStart(2, "0"),
    secs.toString().padStart(2, "0"),
  ].join(":")
}

// Format milliseconds to HH:MM:SS
export function formatDurationMs(ms: number): string {
  return formatDuration(Math.floor(ms / 1000))
}

interface ActivityTimerProps {
  session: {
    id: string
    categoryId: string
    metricId: string
    startTime: Date
    endTime?: Date
    duration: number
    isActive: boolean
    notes?: string
  }
}

export function ActivityTimer({ session }: ActivityTimerProps) {
  const [isRunning, setIsRunning] = useState(session.isActive)
  const [time, setTime] = useState(session.duration / 1000) // Convert milliseconds to seconds

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1)
      }, 1000)
    } else if (interval) {
      clearInterval(interval)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning])

  const handleStartStop = () => {
    setIsRunning(!isRunning)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {session.categoryId} - {session.metricId}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <div
            className={cn("text-4xl font-mono font-bold mb-4", isRunning ? "text-primary" : "text-muted-foreground")}
          >
            {formatDuration(time)}
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleStartStop} variant={isRunning ? "destructive" : "default"}>
              {isRunning ? "Stop" : "Start"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
