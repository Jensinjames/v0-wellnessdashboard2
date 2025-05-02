interface CharacterCounterProps {
  current: number
  max: number
  className?: string
}

export function CharacterCounter({ current, max, className = "" }: CharacterCounterProps) {
  const getCounterColor = () => {
    const percentage = (current / max) * 100
    if (percentage > 100) return "text-red-500"
    if (percentage > 90) return "text-amber-500"
    return "text-muted-foreground"
  }

  return (
    <span className={`text-xs ${getCounterColor()} ${className}`}>
      {current}/{max}
    </span>
  )
}
