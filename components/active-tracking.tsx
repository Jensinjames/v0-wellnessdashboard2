"use client"

import { useState } from "react"
import { Play, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ActivityTimer } from "@/components/activity-timer"
import { StartTrackingDialog } from "@/components/start-tracking-dialog"
import { useTracking } from "@/context/tracking-context"

export function ActiveTracking() {
  const { activeSessions } = useTracking()
  const [showStartDialog, setShowStartDialog] = useState(false)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-medium">Activity Tracking</CardTitle>
          <p className="text-xs text-muted-foreground">Track your time spent on activities in real-time</p>
        </div>
        <Button size="sm" onClick={() => setShowStartDialog(true)}>
          Track Activity
        </Button>
      </CardHeader>
      <CardContent>
        {activeSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="rounded-full bg-muted p-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-sm font-medium">No active tracking</h3>
            <p className="mt-2 text-xs text-muted-foreground max-w-sm">
              Start tracking your activities in real-time to automatically record time spent on different wellness
              categories.
            </p>
            <Button className="mt-4" size="sm" onClick={() => setShowStartDialog(true)}>
              <Play className="mr-1 h-4 w-4" />
              Start Tracking
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Active Sessions ({activeSessions.length})</h3>
            </div>
            <div>
              {activeSessions.map((session) => (
                <ActivityTimer key={session.id} session={session} />
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <StartTrackingDialog open={showStartDialog} onOpenChange={setShowStartDialog} />
    </Card>
  )
}
