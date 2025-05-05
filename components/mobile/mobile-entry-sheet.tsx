"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon, X } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useWellness } from "@/context/wellness-context"
import { MobileMetricInput } from "./mobile-metric-input"
import type { WellnessEntryData, WellnessMetricInput } from "@/types/wellness"

interface MobileEntrySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entryToEdit: WellnessEntryData | null
}

export function MobileEntrySheet({ open, onOpenChange, entryToEdit }: MobileEntrySheetProps) {
  const { categories, addEntry, updateEntry } = useWellness()
  const [date, setDate] = useState<Date>(entryToEdit ? new Date(entryToEdit.date) : new Date())
  const [metrics, setMetrics] = useState<WellnessMetricInput[]>(entryToEdit?.metrics || [])

  // Reset form when entry to edit changes
  useState(() => {
    if (entryToEdit) {
      setDate(new Date(entryToEdit.date))
      setMetrics(entryToEdit.metrics)
    } else {
      setDate(new Date())
      setMetrics([])
    }
  }, [entryToEdit])

  // Handle form submission
  const handleSubmit = () => {
    if (metrics.length === 0) return

    const entry: WellnessEntryData = {
      id: entryToEdit?.id || crypto.randomUUID(),
      date: date.toISOString(),
      metrics: metrics,
    }

    if (entryToEdit) {
      updateEntry(entry)
    } else {
      addEntry(entry)
    }

    onOpenChange(false)
  }

  // Handle metric value change
  const handleMetricChange = (categoryId: string, metricId: string, value: number) => {
    setMetrics((prev) => {
      // Check if metric already exists
      const existingIndex = prev.findIndex((m) => m.categoryId === categoryId && m.metricId === metricId)

      if (existingIndex >= 0) {
        // Update existing metric
        const updated = [...prev]
        updated[existingIndex] = { ...updated[existingIndex], value }
        return updated
      } else {
        // Add new metric
        return [...prev, { categoryId, metricId, value }]
      }
    })
  }

  // Get metric value
  const getMetricValue = (categoryId: string, metricId: string): number => {
    const metric = metrics.find((m) => m.categoryId === categoryId && m.metricId === metricId)
    return metric?.value || 0
  }

  // Filter enabled categories
  const enabledCategories = categories.filter((c) => c.enabled)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-xl">
        <SheetHeader className="flex flex-row items-center justify-between border-b pb-4">
          <SheetTitle>{entryToEdit ? "Edit Entry" : "Add Entry"}</SheetTitle>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </SheetHeader>

        <div className="mt-4 space-y-4 overflow-y-auto pb-20">
          <div className="space-y-2">
            <label className="text-sm font-medium">Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Select a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={(date) => date && setDate(date)} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          {enabledCategories.map((category) => (
            <div key={category.id} className="space-y-3 rounded-lg border p-3">
              <h3 className="font-medium">{category.name}</h3>

              <div className="space-y-4">
                {category.metrics.map((metric) => (
                  <MobileMetricInput
                    key={metric.id}
                    metric={metric}
                    value={getMetricValue(category.id, metric.id)}
                    onChange={(value) => handleMetricChange(category.id, metric.id, value)}
                  />
                ))}
              </div>
            </div>
          ))}

          <div className="sticky bottom-0 mt-6 flex gap-2 bg-background pt-4">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSubmit}>
              {entryToEdit ? "Update" : "Save"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
