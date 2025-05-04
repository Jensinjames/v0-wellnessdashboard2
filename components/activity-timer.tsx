"use client"

import { useState, useEffect, useRef } from "react"
import { Play, Pause, StopCircle, X, Clock, Edit, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useTracking, type TrackingSession } from "@/context/tracking-context"
import { useWellness } from "@/context/wellness-context"
import { getCategoryColorClass } from "@/types/wellness"

/**
 * Format milliseconds into a time string (HH:MM:SS)
 * @param ms Time in milliseconds
 * @returns Formatted time string
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [
    hours.toString().padStart(2, "0"),
    minutes.toString().padStart(2, "0"),
    seconds.toString().padStart(2, "0"),
  ].join(":")
}

interface ActivityTimerProps {
  session: TrackingSession
}

export function ActivityTimer({ session }: ActivityTimerProps) {
  const { pauseTracking, resumeTracking, stopTracking, discardTracking, updateNotes } = useTracking()
  const { categories } = useWellness()
  const [showStopDialog, setShowStopDialog] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notes, setNotes] = useState(session.notes || "")
  const [lastAnnouncedTime, setLastAnnouncedTime] = useState("")
  const timerRef = useRef<HTMLSpanElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)

  // Find category and metric information
  const category = categories.find((c) => c.id === session.categoryId)
  const metric = category?.metrics.find((m) => m.id === session.metricId)

  // Effect to announce time changes at appropriate intervals
  useEffect(() => {
    const formattedTime = formatDuration(session.duration)

    // Only announce time changes every minute to avoid too frequent announcements
    const minutes = Math.floor(session.duration / 60000)
    const currentMinuteTime = `${minutes} minute${minutes !== 1 ? "s" : ""}`

    if (currentMinuteTime !== lastAnnouncedTime && minutes > 0 && session.isActive) {
      setLastAnnouncedTime(currentMinuteTime)

      // Update the status for screen readers
      if (statusRef.current) {
        statusRef.current.textContent = `${category?.name || "Activity"} tracking: ${currentMinuteTime} elapsed`
      }
    }
  }, [session.duration, session.isActive, category?.name, lastAnnouncedTime])

  const handlePauseResume = () => {
    if (session.isActive) {
      pauseTracking(session.id)
      if (statusRef.current) {
        statusRef.current.textContent = `${category?.name || "Activity"} tracking paused at ${formatDuration(session.duration)}`
      }
    } else {
      resumeTracking(session.id)
      if (statusRef.current) {
        statusRef.current.textContent = `${category?.name || "Activity"} tracking resumed`
      }
    }
  }

  const handleStop = () => {
    setShowStopDialog(true)
  }

  const confirmStop = () => {
    stopTracking(session.id)
    setShowStopDialog(false)
    if (statusRef.current) {
      statusRef.current.textContent = `${category?.name || "Activity"} tracking stopped and saved after ${formatDuration(session.duration)}`
    }
  }

  const handleDiscard = () => {
    discardTracking(session.id)
    setShowStopDialog(false)
    if (statusRef.current) {
      statusRef.current.textContent = `${category?.name || "Activity"} tracking discarded`
    }
  }

  const handleSaveNotes = () => {
    updateNotes(session.id, notes)
    setEditingNotes(false)
    if (statusRef.current) {
      statusRef.current.textContent = `Notes saved for ${category?.name || "activity"} tracking`
    }
  }

  if (!category || !metric) {
    return null
  }

  const colorClass = getCategoryColorClass(category, "bg")
  const textColorClass = getCategoryColorClass(category, "text")

  return (
    <>
      <Card className="mb-3 overflow-hidden">
        <div className={`${colorClass} h-1`} />
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={textColorClass}>
                {category.name}
              </Badge>
              <span className="font-medium">{metric.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span
                className="font-mono font-medium"
                ref={timerRef}
                aria-live="off" // We'll use a separate element for announcements
              >
                {formatDuration(session.duration)}
              </span>
            </div>
          </div>

          {/* Hidden status announcer for screen readers */}
          <div className="sr-only" aria-live="polite" aria-atomic="true" ref={statusRef}>
            {session.isActive
              ? `${category.name} tracking in progress: ${formatDuration(session.duration)} elapsed`
              : `${category.name} tracking paused at ${formatDuration(session.duration)}`}
          </div>

          {/* Notes section */}
          {editingNotes ? (
            <div className="mt-2">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this activity..."
                className="h-20 text-sm"
                aria-label={`Notes for ${category.name} ${metric.name} activity`}
              />
              <div className="mt-2 flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingNotes(false)}
                  aria-label="Cancel editing notes"
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveNotes} aria-label="Save activity notes">
                  <Check className="mr-1 h-4 w-4" aria-hidden="true" />
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <>
              {session.notes && <p className="mt-2 text-sm text-muted-foreground">{session.notes}</p>}
              <div className="mt-2 flex justify-between">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingNotes(true)}
                  aria-label={session.notes ? "Edit activity notes" : "Add activity notes"}
                >
                  <Edit className="mr-1 h-4 w-4" aria-hidden="true" />
                  {session.notes ? "Edit Notes" : "Add Notes"}
                </Button>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handlePauseResume}
                    aria-label={session.isActive ? "Pause activity tracking" : "Resume activity tracking"}
                  >
                    {session.isActive ? (
                      <>
                        <Pause className="mr-1 h-4 w-4" aria-hidden="true" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="mr-1 h-4 w-4" aria-hidden="true" />
                        Resume
                      </>
                    )}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleStop} aria-label="Stop activity tracking">
                    <StopCircle className="mr-1 h-4 w-4" aria-hidden="true" />
                    Stop
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Stop confirmation dialog */}
      <Dialog open={showStopDialog} onOpenChange={setShowStopDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stop Activity Tracking</DialogTitle>
            <DialogDescription>
              Do you want to save this tracking session or discard it? Saving will add{" "}
              {(session.duration / (1000 * 60 * 60)).toFixed(2)} hours to your {metric.name} metric.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStopDialog(false)} aria-label="Cancel stopping activity">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDiscard} aria-label="Discard activity tracking session">
              <X className="mr-1 h-4 w-4" aria-hidden="true" />
              Discard
            </Button>
            <Button onClick={confirmStop} aria-label="Save activity tracking session">
              <Check className="mr-1 h-4 w-4" aria-hidden="true" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
