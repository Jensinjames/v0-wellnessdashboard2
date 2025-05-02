"use client"

import { ActivityPatterns } from "@/components/activity-patterns"

export default function ActivityPatternsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Activity Patterns</h1>
        <p className="text-muted-foreground">
          Analyze your activity patterns and identify trends in your wellness journey.
        </p>
      </div>
      <ActivityPatterns />
    </div>
  )
}
