import { cn } from "@/lib/utils"

interface CharacterCounterProps {
  value: string
  maxLength: number
  className?: string
}

export function CharacterCounter({ value, maxLength, className }: CharacterCounterProps) {
  const count = value?.length || 0
  const remaining = maxLength - count
  const isWarning = remaining <= maxLength * 0.1 && remaining > 0
  const isExceeded = remaining < 0

  return (
    <div
      className={cn("text-xs", isWarning ? "text-amber-600" : "", isExceeded ? "text-red-500" : "", className)}
      aria-live="polite"
    >
      <span className="sr-only">
        {isExceeded
          ? `Character limit exceeded by ${Math.abs(remaining)} characters`
          : `${remaining} characters remaining`}
      </span>
      <span aria-hidden="true">
        {count}/{maxLength}
      </span>
    </div>
  )
}
