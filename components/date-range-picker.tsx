"use client"

import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerProps {
  date: Date
  setDate: (date: Date) => void
  id?: string
}

export function DatePicker({ date, setDate, id }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button id={id} variant="outline" className="w-full justify-start text-left font-normal">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={(date) => date && setDate(date)} initialFocus />
      </PopoverContent>
    </Popover>
  )
}
