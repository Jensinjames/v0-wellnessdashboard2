"use client"

import { useState, useEffect } from "react"
import { Clock, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTracking } from "@/context/tracking-context"
import { formatDuration } from "./activity-timer"

export function TrackingStatus() {
  const { activeSessions } = useTracking()
  const [totalDuration, setTotalDuration] = useState(0)

  // Calculate total duration of all active sessions
  useEffect(() => {
    if (activeSessions.length === 0) return

    const calculateTotal = () => {
      return activeSessions.reduce((total, session) => {
        if (session.isActive) {
          const now = new Date()
          const sessionDuration = now.getTime() - session.startTime.getTime()
          return total + sessionDuration
        }
        return total + session.duration
      }, 0)
    }

    setTotalDuration(calculateTotal())

    const interval = setInterval(() => {
      setTotalDuration(calculateTotal())
    }, 1000)

    return () => clearInterval(interval)
  }, [activeSessions])

  if (activeSessions.length === 0) {
    return null
  }

  const activeCount = activeSessions.filter((s) => s.isActive).length
  const pausedCount = activeSessions.length - activeCount

  return (
    <Button variant="outline" className="bg-white/10 text-white hover:bg-white/20">
      <Clock className="mr-2 h-4 w-4" />
      <span className="font-mono">{formatDuration(totalDuration)}</span>
      {activeCount > 0 && (
        <span className="ml-2 rounded-full bg-green-500 px-1.5 py-0.5 text-xs font-medium text-white">
          {activeCount} active
        </span>
      )}
      {pausedCount > 0 && (
        <span className="ml-2 rounded-full bg-yellow-500 px-1.5 py-0.5 text-xs font-medium text-white">
          <Pause className="mr-0.5 h-3 w-3 inline" />
          {pausedCount}
        </span>
      )}
    </Button>
  )
}
