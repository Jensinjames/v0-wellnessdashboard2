// Convert from mixed exports to consistent named exports

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return `${formatDate(d)} at ${formatTime(d)}`
}

export function getDaysBetween(start: Date | string, end: Date | string): number {
  const startDate = typeof start === "string" ? new Date(start) : start
  const endDate = typeof end === "string" ? new Date(end) : end

  // Set to noon to avoid DST issues
  startDate.setHours(12, 0, 0, 0)
  endDate.setHours(12, 0, 0, 0)

  // Calculate difference in days
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

export function isToday(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date
  const today = new Date()

  return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
}

export function isYesterday(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  return (
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()
  )
}

export function getRelativeTimeString(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  const now = new Date()

  if (isToday(d)) {
    return `Today at ${formatTime(d)}`
  }

  if (isYesterday(d)) {
    return `Yesterday at ${formatTime(d)}`
  }

  const diffDays = getDaysBetween(d, now)

  if (diffDays < 7) {
    return `${diffDays} days ago`
  }

  return formatDate(d)
}
