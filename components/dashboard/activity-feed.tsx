"use client"

import { format } from "date-fns"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

interface ActivityFeedProps {
  entries: any[]
  isLoading: boolean
}

export function ActivityFeed({ entries, isLoading }: ActivityFeedProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex justify-between">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-6 w-1/4" />
            </div>
            <Skeleton className="h-4 w-full mt-2" />
            <Skeleton className="h-4 w-2/3 mt-2" />
          </Card>
        ))}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px]">
        <p className="text-muted-foreground">No activities recorded yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
      {entries.map((entry) => (
        <Card key={entry.id} className="p-4 hover:bg-muted/50 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{entry.activity}</h3>
              <p className="text-sm text-muted-foreground">
                {format(new Date(entry.timestamp), "PPP")} • {entry.duration} minutes
              </p>
            </div>
            <Badge variant="outline">{entry.category}</Badge>
          </div>

          {entry.notes && <p className="mt-2 text-sm">{entry.notes}</p>}

          <div className="flex mt-2 gap-2">
            {entry.mood_rating && (
              <Badge variant="secondary" className="text-xs">
                Mood: {entry.mood_rating}/10
              </Badge>
            )}

            {entry.energy_level && (
              <Badge variant="secondary" className="text-xs">
                Energy: {entry.energy_level}/10
              </Badge>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}
