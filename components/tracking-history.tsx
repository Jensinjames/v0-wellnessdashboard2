"use client"

import { useState } from "react"
import { format } from "date-fns"
import { History, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useTracking } from "@/context/tracking-context"
import { useWellness } from "@/context/wellness-context"
import { getCategoryColorClass } from "@/types/wellness"
import { formatDuration } from "./activity-timer"

export function TrackingHistory() {
  const { recentSessions } = useTracking()
  const { categories } = useWellness()
  const [searchTerm, setSearchTerm] = useState("")

  // Filter sessions based on search term
  const filteredSessions = recentSessions.filter((session) => {
    const category = categories.find((c) => c.id === session.categoryId)
    const metric = category?.metrics.find((m) => m.id === session.metricId)

    const searchString = `${category?.name || ""} ${metric?.name || ""} ${session.notes || ""}`.toLowerCase()
    return searchString.includes(searchTerm.toLowerCase())
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg">Tracking History</CardTitle>
          <p className="text-sm text-muted-foreground">Recent activity tracking sessions</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Input
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-[200px] pl-8"
            />
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
          <Button variant="outline" size="sm" className="h-9 gap-1">
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filter</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-3">
              <History className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-medium">No tracking history</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              {searchTerm
                ? "No sessions match your search. Try a different search term."
                : "Your completed tracking sessions will appear here."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border">
              <div className="grid grid-cols-12 gap-2 border-b bg-muted/50 p-2 text-xs font-medium">
                <div className="col-span-3">Category / Metric</div>
                <div className="col-span-2">Duration</div>
                <div className="col-span-3">Date</div>
                <div className="col-span-4">Notes</div>
              </div>
              <div className="divide-y">
                {filteredSessions.map((session) => {
                  const category = categories.find((c) => c.id === session.categoryId)
                  const metric = category?.metrics.find((m) => m.id === session.metricId)

                  if (!category || !metric) return null

                  const colorClass = getCategoryColorClass(category, "bg")
                  const textColorClass = getCategoryColorClass(category, "text")

                  return (
                    <div key={session.id} className="grid grid-cols-12 gap-2 p-2 text-sm">
                      <div className="col-span-3">
                        <div className="flex flex-col">
                          <Badge variant="outline" className={`mb-1 w-fit ${textColorClass}`}>
                            {category.name}
                          </Badge>
                          <span>{metric.name}</span>
                        </div>
                      </div>
                      <div className="col-span-2 font-mono">{formatDuration(session.duration)}</div>
                      <div className="col-span-3">
                        <div className="flex flex-col">
                          <span>{format(new Date(session.startTime), "MMM d, yyyy")}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(session.startTime), "h:mm a")}
                            {session.endTime && ` - ${format(new Date(session.endTime), "h:mm a")}`}
                          </span>
                        </div>
                      </div>
                      <div className="col-span-4 truncate text-muted-foreground">{session.notes || "No notes"}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
