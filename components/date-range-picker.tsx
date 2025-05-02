import { Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface DateRangePickerProps {
  className?: string
}

export function DateRangePicker({ className }: DateRangePickerProps) {
  return (
    <div className={cn("flex items-center rounded-md border px-3 py-1.5 text-sm", className)}>
      <Calendar className="mr-2 h-4 w-4 opacity-70" />
      <span>Apr 13, 2023 - Apr 20, 2023</span>
    </div>
  )
}
