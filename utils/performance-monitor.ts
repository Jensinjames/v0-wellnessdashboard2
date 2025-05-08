/**
 * Performance Monitoring Utility
 * Tracks and logs performance metrics for the application
 */
import { createLogger } from "@/utils/logger"

// Create a dedicated logger
const logger = createLogger("Performance")

// Performance mark categories
export enum PerformanceCategory {
  API = "api",
  RENDER = "render",
  DATABASE = "database",
  AUTH = "auth",
  NETWORK = "network",
  EDGE_FUNCTION = "edge-function",
  CACHE = "cache",
  GENERAL = "general",
}

// Performance mark interface
interface PerformanceMark {
  id: string
  category: PerformanceCategory
  name: string
  startTime: number
  endTime?: number
  duration?: number
  metadata?: Record<string, any>
}

// Store active marks
const activeMarks: Record<string, PerformanceMark> = {}

// Store completed marks (limited size)
const MAX_COMPLETED_MARKS = 1000
const completedMarks: PerformanceMark[] = []

/**
 * Start timing an operation
 */
export function startTiming(
  name: string,
  category: PerformanceCategory = PerformanceCategory.GENERAL,
  metadata?: Record<string, any>,
): string {
  const id = `${category}-${name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

  const mark: PerformanceMark = {
    id,
    category,
    name,
    startTime: performance.now(),
    metadata,
  }

  activeMarks[id] = mark

  logger.debug(`Started timing: ${name} (${category})`, metadata)

  return id
}

/**
 * End timing an operation
 */
export function endTiming(id: string, additionalMetadata?: Record<string, any>): PerformanceMark | null {
  const mark = activeMarks[id]

  if (!mark) {
    logger.warn(`Attempted to end timing for unknown mark: ${id}`)
    return null
  }

  // Calculate duration
  mark.endTime = performance.now()
  mark.duration = mark.endTime - mark.startTime

  // Merge additional metadata
  if (additionalMetadata) {
    mark.metadata = { ...mark.metadata, ...additionalMetadata }
  }

  // Remove from active marks
  delete activeMarks[id]

  // Add to completed marks
  completedMarks.unshift(mark)

  // Trim if too large
  if (completedMarks.length > MAX_COMPLETED_MARKS) {
    completedMarks.length = MAX_COMPLETED_MARKS
  }

  // Log the timing
  const durationMs = mark.duration.toFixed(2)

  if (mark.duration > 1000) {
    logger.warn(`Slow operation detected: ${mark.name} (${mark.category}) took ${durationMs}ms`, mark.metadata, {
      id: mark.id,
      duration: mark.duration,
    })
  } else {
    logger.debug(`Completed timing: ${mark.name} (${mark.category}) took ${durationMs}ms`, mark.metadata, {
      id: mark.id,
      duration: mark.duration,
    })
  }

  return mark
}

/**
 * Time an async function
 */
export async function timeAsync<T>(
  name: string,
  fn: () => Promise<T>,
  category: PerformanceCategory = PerformanceCategory.GENERAL,
  metadata?: Record<string, any>,
): Promise<T> {
  const id = startTiming(name, category, metadata)

  try {
    const result = await fn()
    endTiming(id, { success: true })
    return result
  } catch (error) {
    endTiming(id, { success: false, error: error instanceof Error ? error.message : String(error) })
    throw error
  }
}

/**
 * Get all completed performance marks
 */
export function getPerformanceMarks(): PerformanceMark[] {
  return [...completedMarks]
}

/**
 * Get active performance marks
 */
export function getActivePerformanceMarks(): PerformanceMark[] {
  return Object.values(activeMarks)
}

/**
 * Clear performance marks
 */
export function clearPerformanceMarks(): void {
  completedMarks.length = 0
  logger.info("Performance marks cleared")
}

/**
 * Get performance statistics by category
 */
export function getPerformanceStatsByCategory(): Record<
  PerformanceCategory,
  {
    count: number
    totalDuration: number
    averageDuration: number
    minDuration: number
    maxDuration: number
  }
> {
  const stats: Record<
    PerformanceCategory,
    {
      count: number
      totalDuration: number
      averageDuration: number
      minDuration: number
      maxDuration: number
    }
  > = {} as any

  // Initialize stats for all categories
  Object.values(PerformanceCategory).forEach((category) => {
    stats[category] = {
      count: 0,
      totalDuration: 0,
      averageDuration: 0,
      minDuration: Number.POSITIVE_INFINITY,
      maxDuration: 0,
    }
  })

  // Calculate stats
  completedMarks.forEach((mark) => {
    if (mark.duration !== undefined) {
      const categoryStat = stats[mark.category]

      categoryStat.count++
      categoryStat.totalDuration += mark.duration
      categoryStat.minDuration = Math.min(categoryStat.minDuration, mark.duration)
      categoryStat.maxDuration = Math.max(categoryStat.maxDuration, mark.duration)
    }
  })

  // Calculate averages
  Object.values(PerformanceCategory).forEach((category) => {
    const categoryStat = stats[category]

    if (categoryStat.count > 0) {
      categoryStat.averageDuration = categoryStat.totalDuration / categoryStat.count
    }

    // Fix min duration if no marks
    if (categoryStat.minDuration === Number.POSITIVE_INFINITY) {
      categoryStat.minDuration = 0
    }
  })

  return stats
}
