"use client"

import { Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"

interface DateRangePickerProps {
  className?: string
}

export function DateRangePicker({ className }: DateRangePickerProps) {
  return (
    <div className={cn("flex items-center rounded-md border px-3 py-1.5 text-sm", className)}>
      <Calendar className="mr-2 h-4 w-4 opacity-70" aria-hidden="true" />
      <span>Apr 13, 2023 - Apr 20, 2023</span>
    </div>
  )
}

interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date) => void
  className?: string
  id?: string
}

export function DatePicker({ date, onDateChange, className, id }: DatePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(date)
  const uniqueId = id || "date-picker"
  const buttonId = `${uniqueId}-button`
  const calendarId = `${uniqueId}-calendar`

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date && onDateChange) {
      onDateChange(date)
    }
  }

  return (
    <div className={cn("flex flex-col space-y-1.5", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
            aria-label={selectedDate ? `Selected date: ${format(selectedDate, "PPP")}` : "Pick a date"}
            id={buttonId}
          >
            <Calendar className="mr-2 h-4 w-4" aria-hidden="true" />
            {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" id={calendarId}>
          <CalendarComponent
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
            aria-label="Select a date"
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
