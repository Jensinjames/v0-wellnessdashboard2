import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { WellnessEntry, WellnessCategory } from "@/types/supabase"
import { formatMinutes } from "@/utils/wellness-utils"

interface TrackingHistoryCardProps {
  entries: WellnessEntry[]
  categories: WellnessCategory[]
}

export function TrackingHistoryCard({ entries, categories }: TrackingHistoryCardProps) {
  // Group entries by date
  const entriesByDate = entries.reduce<Record<string, WellnessEntry[]>>((acc, entry) => {
    if (!acc[entry.entry_date]) {
      acc[entry.entry_date] = []
    }
    acc[entry.entry_date].push(entry)
    return acc
  }, {})

  // Sort dates in descending order
  const sortedDates = Object.keys(entriesByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  // Get category name by id
  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    return category?.name || "Unknown"
  }

  // Get category color by id
  const getCategoryColor = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    return category?.color || "#94a3b8"
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tracking History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedDates.length === 0 ? (
            <p className="text-center text-muted-foreground">No tracking history yet</p>
          ) : (
            sortedDates.map((date) => (
              <div key={date} className="space-y-2">
                <h3 className="font-medium">{formatDate(date)}</h3>
                <div className="space-y-1">
                  {entriesByDate[date].map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between rounded-md border p-2">
                      <div className="flex items-center">
                        <div
                          className="mr-2 h-3 w-3 rounded-full"
                          style={{ backgroundColor: getCategoryColor(entry.category_id) }}
                        />
                        <span>{getCategoryName(entry.category_id)}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{formatMinutes(entry.minutes_spent)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
