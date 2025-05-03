"use client"

import { useState } from "react"
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

// Format milliseconds to HH:MM:SS
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

  // Find category and metric information
  const category = categories.find((c) => c.id === session.categoryId)
  const metric = category?.metrics.find((m) => m.id === session.metricId)

  const handlePauseResume = () => {
    if (session.isActive) {
      pauseTracking(session.id)
    } else {
      resumeTracking(session.id)
    }
  }

  const handleStop = () => {
    setShowStopDialog(true)
  }

  const confirmStop = () => {
    stopTracking(session.id)
    setShowStopDialog(false)
  }

  const handleDiscard = () => {
    discardTracking(session.id)
    setShowStopDialog(false)
  }

  const handleSaveNotes = () => {
    updateNotes(session.id, notes)
    setEditingNotes(false)
  }

  if (!category || !metric) {
    return null
  }

  const colorClass = getCategoryColorClass(category, "bg")
  const textColorClass = getCategoryColorClass(category, "text")

  return (
    <>
      <Card className="mb-3 overflow-hidden">
        <div className={colorClass + " h-1"}></div>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={textColorClass}>
                {category.name}
              </Badge>
              <span className="font-medium">{metric.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono font-medium">{formatDuration(session.duration)}</span>
            </div>
          </div>

          {editingNotes ? (
            <div className="mt-2">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this activity..."
                className="h-20 text-sm"
              />
              <div className="mt-2 flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setEditingNotes(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveNotes}>
                  <Check className="mr-1 h-4 w-4" />
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <>
              {session.notes && <p className="mt-2 text-sm text-muted-foreground">{session.notes}</p>}
              <div className="mt-2 flex justify-between">
                <Button size="sm" variant="ghost" onClick={() => setEditingNotes(true)}>
                  <Edit className="mr-1 h-4 w-4" />
                  {session.notes ? "Edit Notes" : "Add Notes"}
                </Button>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handlePauseResume}>
                    {session.isActive ? (
                      <>
                        <Pause className="mr-1 h-4 w-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="mr-1 h-4 w-4" />
                        Resume
                      </>
                    )}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleStop}>
                    <StopCircle className="mr-1 h-4 w-4" />
                    Stop
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

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
            <Button variant="outline" onClick={() => setShowStopDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDiscard}>
              <X className="mr-1 h-4 w-4" />
              Discard
            </Button>
            <Button onClick={confirmStop}>
              <Check className="mr-1 h-4 w-4" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
