/**
 * RLS Telemetry System
 * Monitors and analyzes RLS call frequency and patterns
 */
import { createLogger } from "@/utils/logger"

const logger = createLogger("RLSTelemetry")

// Telemetry event type
type TelemetryEvent = {
  id: string
  timestamp: number
  type: "query" | "mutation" | "auth" | "cache" | "error"
  table?: string
  operation?: string
  duration: number
  status: "success" | "error"
  cacheHit?: boolean
  errorMessage?: string
  metadata?: Record<string, any>
}

// Configuration
type TelemetryConfig = {
  enabled: boolean
  maxEvents: number
  samplingRate: number // 0-1, percentage of events to record
  debug: boolean
  autoFlush: boolean
  flushInterval: number // in milliseconds
  endpoint?: string // Optional endpoint to send telemetry data
}

// Default configuration
const DEFAULT_CONFIG: TelemetryConfig = {
  enabled: true,
  maxEvents: 1000,
  samplingRate: 1, // Record all events
  debug: false,
  autoFlush: false,
  flushInterval: 60000, // 1 minute
}

/**
 * RLS Telemetry class
 * Collects and analyzes telemetry data for RLS calls
 */
export class RLSTelemetry {
  private events: TelemetryEvent[]
  private config: TelemetryConfig
  private flushTimer: NodeJS.Timeout | null = null

  constructor(config: Partial<TelemetryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.events = []

    // Set up auto-flush if enabled
    if (this.config.autoFlush && typeof window !== "undefined") {
      this.flushTimer = setInterval(() => this.flush(), this.config.flushInterval)
    }
  }

  /**
   * Record a telemetry event
   * @param event Event data
   */
  recordEvent(event: Omit<TelemetryEvent, "id" | "timestamp">): void {
    if (!this.config.enabled) return

    // Apply sampling
    if (this.config.samplingRate < 1 && Math.random() > this.config.samplingRate) {
      return
    }

    const fullEvent: TelemetryEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
      ...event,
    }

    this.events.push(fullEvent)

    // Trim if we exceed max events
    if (this.events.length > this.config.maxEvents) {
      this.events = this.events.slice(-this.config.maxEvents)
    }

    if (this.config.debug) {
      logger.debug(`Recorded telemetry event: ${event.type}`, event)
    }
  }

  /**
   * Record a query event
   * @param table Table name
   * @param operation Operation type
   * @param duration Duration in milliseconds
   * @param status Success or error
   * @param metadata Additional metadata
   */
  recordQuery(
    table: string,
    operation: string,
    duration: number,
    status: "success" | "error" = "success",
    metadata: Record<string, any> = {},
  ): void {
    this.recordEvent({
      type: "query",
      table,
      operation,
      duration,
      status,
      errorMessage: status === "error" ? metadata.error?.message : undefined,
      metadata,
    })
  }

  /**
   * Record a cache event
   * @param table Table name
   * @param operation Operation type
   * @param duration Duration in milliseconds
   * @param cacheHit Whether the query was a cache hit
   * @param metadata Additional metadata
   */
  recordCache(
    table: string,
    operation: string,
    duration: number,
    cacheHit: boolean,
    metadata: Record<string, any> = {},
  ): void {
    this.recordEvent({
      type: "cache",
      table,
      operation,
      duration,
      status: "success",
      cacheHit,
      metadata,
    })
  }

  /**
   * Record an error event
   * @param errorMessage Error message
   * @param metadata Additional metadata
   */
  recordError(errorMessage: string, metadata: Record<string, any> = {}): void {
    this.recordEvent({
      type: "error",
      duration: 0,
      status: "error",
      errorMessage,
      metadata,
    })
  }

  /**
   * Get all recorded events
   */
  getEvents(): TelemetryEvent[] {
    return [...this.events]
  }

  /**
   * Get events filtered by type
   * @param type Event type
   */
  getEventsByType(type: TelemetryEvent["type"]): TelemetryEvent[] {
    return this.events.filter((event) => event.type === type)
  }

  /**
   * Get events for a specific table
   * @param table Table name
   */
  getEventsByTable(table: string): TelemetryEvent[] {
    return this.events.filter((event) => event.table === table)
  }

  /**
   * Clear all events
   */
  clearEvents(): void {
    this.events = []
  }

  /**
   * Get telemetry statistics
   */
  getStats() {
    const stats = {
      totalEvents: this.events.length,
      byType: {} as Record<string, number>,
      byTable: {} as Record<string, number>,
      byOperation: {} as Record<string, number>,
      errorRate: 0,
      cacheHitRate: 0,
      averageDuration: 0,
    }

    // Skip calculation if no events
    if (this.events.length === 0) {
      return stats
    }

    // Count by type
    this.events.forEach((event) => {
      // By type
      stats.byType[event.type] = (stats.byType[event.type] || 0) + 1

      // By table
      if (event.table) {
        stats.byTable[event.table] = (stats.byTable[event.table] || 0) + 1
      }

      // By operation
      if (event.operation) {
        stats.byOperation[event.operation] = (stats.byOperation[event.operation] || 0) + 1
      }
    })

    // Calculate error rate
    const errorEvents = this.events.filter((event) => event.status === "error")
    stats.errorRate = errorEvents.length / this.events.length

    // Calculate cache hit rate
    const cacheEvents = this.events.filter((event) => event.type === "cache")
    if (cacheEvents.length > 0) {
      const cacheHits = cacheEvents.filter((event) => event.cacheHit)
      stats.cacheHitRate = cacheHits.length / cacheEvents.length
    }

    // Calculate average duration
    const totalDuration = this.events.reduce((sum, event) => sum + event.duration, 0)
    stats.averageDuration = totalDuration / this.events.length

    return stats
  }

  /**
   * Flush events to the configured endpoint
   */
  async flush(): Promise<boolean> {
    if (!this.config.endpoint || this.events.length === 0) {
      return false
    }

    try {
      const eventsToSend = [...this.events]
      this.events = []

      const response = await fetch(this.config.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          events: eventsToSend,
          timestamp: Date.now(),
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to send telemetry: ${response.statusText}`)
      }

      if (this.config.debug) {
        logger.debug(`Flushed ${eventsToSend.length} telemetry events`)
      }

      return true
    } catch (error) {
      logger.error("Error flushing telemetry:", error)

      // Put the events back
      this.events = [...this.events, ...this.events]

      // Trim if we exceed max events
      if (this.events.length > this.config.maxEvents) {
        this.events = this.events.slice(-this.config.maxEvents)
      }

      return false
    }
  }

  /**
   * Dispose of the telemetry instance
   */
  dispose(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
  }
}

// Create a singleton instance
let telemetryInstance: RLSTelemetry | null = null

/**
 * Get the global RLS telemetry instance
 */
export function getRLSTelemetry(config?: Partial<TelemetryConfig>): RLSTelemetry {
  if (!telemetryInstance) {
    telemetryInstance = new RLSTelemetry(config)
  }
  return telemetryInstance
}

/**
 * Reset the RLS telemetry (useful for testing)
 */
export function resetRLSTelemetry(): void {
  if (telemetryInstance) {
    telemetryInstance.dispose()
  }
  telemetryInstance = null
}
