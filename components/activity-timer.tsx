"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, CheckCircle } from "lucide-react"
import { formatTime } from "@/utils/time-utils"

interface ActivityTimerProps {
  activityName: string
  onComplete?: (duration: number) => void
  initialTime?: number
}

export function ActivityTimer({ activityName, onComplete, initialTime = 0 }: ActivityTimerProps) {
  const [time, setTime] = useState(initialTime)
  const [isRunning, setIsRunning] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const startTimer = () => {
    if (!isRunning && !isCompleted) {
      setIsRunning(true)
      startTimeRef.current = Date.now() - time
      intervalRef.current = setInterval(() => {
        setTime(Date.now() - startTimeRef.current)
      }, 10)
    }
  }

  const pauseTimer = () => {
    if (isRunning && intervalRef.current) {
      clearInterval(intervalRef.current)
      setIsRunning(false)
    }
  }

  const resetTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    setTime(0)
    setIsRunning(false)
    setIsCompleted(false)
    startTimeRef.current = 0
  }

  const completeActivity = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    setIsRunning(false)
    setIsCompleted(true)

    if (onComplete) {
      onComplete(time)
    }
  }

  const formattedTime = formatTime(time)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{activityName}</span>
          {isCompleted && <CheckCircle className="h-5 w-5 text-green-500" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="text-4xl font-mono font-bold mb-4" aria-live="polite">
          {formattedTime}
        </div>
        <div className="flex gap-2">
          {!isCompleted && (
            <>
              {!isRunning ? (
                <Button onClick={startTimer} size="sm" className="flex items-center gap-1">
                  <Play className="h-4 w-4" />
                  Start
                </Button>
              ) : (
                <Button onClick={pauseTimer} size="sm" variant="outline" className="flex items-center gap-1">
                  <Pause className="h-4 w-4" />
                  Pause
                </Button>
              )}
              <Button onClick={resetTimer} size="sm" variant="outline" className="flex items-center gap-1">
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        {!isCompleted && time > 0 && (
          <Button onClick={completeActivity} className="w-full">
            Complete Activity
          </Button>
        )}
        {isCompleted && (
          <Button onClick={resetTimer} variant="outline" className="w-full">
            Start New Timer
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
