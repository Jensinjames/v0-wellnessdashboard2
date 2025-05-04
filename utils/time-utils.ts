/**
 * Format milliseconds into a readable time string (HH:MM:SS.ms)
 * @param ms Time in milliseconds
 * @returns Formatted time string
 */
export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const milliseconds = Math.floor((ms % 1000) / 10)

  return [
    hours > 0 ? hours.toString().padStart(2, "0") + ":" : "",
    minutes.toString().padStart(2, "0"),
    ":",
    seconds.toString().padStart(2, "0"),
    ".",
    milliseconds.toString().padStart(2, "0"),
  ].join("")
}

/**
 * Format milliseconds into a human-readable duration (e.g., "2h 30m")
 * @param ms Time in milliseconds
 * @returns Human-readable duration string
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    const remainingMinutes = minutes % 60
    return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}m` : ""}`
  }

  if (minutes > 0) {
    return `${minutes}m`
  }

  return `${seconds}s`
}
