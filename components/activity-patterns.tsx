"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export interface Activity {
  id: string
  categoryId: string
  categoryName: string
  subcategoryId: string
  subcategoryName: string
  date: Date | string
  duration: number
  value: number
}

interface ActivityPatternsProps {
  activities: Activity[]
}

export function ActivityPatterns({ activities }: ActivityPatternsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Activity Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            {activities.length === 0 ? (
              <p>No activities recorded yet. Start tracking to see patterns.</p>
            ) : (
              <p>You have recorded {activities.length} activities.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
