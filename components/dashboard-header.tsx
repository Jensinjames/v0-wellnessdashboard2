import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import type { WellnessEntryData } from "@/types/wellness"

interface DashboardHeaderProps {
  todayEntries?: WellnessEntryData[]
}

export function DashboardHeader({ todayEntries = [] }: DashboardHeaderProps) {
  const today = new Date()
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const hasEntriesForToday = todayEntries && todayEntries.length > 0

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div>
        <h1 className="text-3xl font-bold">Wellness Dashboard</h1>
        <p className="text-muted-foreground">{formattedDate}</p>
        {hasEntriesForToday ? (
          <p className="text-sm text-green-600 font-medium mt-1">{todayEntries.length} entries logged today</p>
        ) : (
          <p className="text-sm text-amber-600 font-medium mt-1">No entries logged today</p>
        )}
      </div>
      <Link href="/add-entry">
        <Button className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Entry
        </Button>
      </Link>
    </div>
  )
}
