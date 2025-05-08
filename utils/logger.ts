"use client"

// Log levels
export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  TRACE = 5,
}

// Log level names for display
export const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.NONE]: "NONE",
  [LogLevel.ERROR]: "ERROR",
  [LogLevel.WARN]: "WARN",
  [LogLevel.INFO]: "INFO",
  [LogLevel.DEBUG]: "DEBUG",
  [LogLevel.TRACE]: "TRACE",
}

// Store log entries for retrieval
export interface LogEntry {
  level: LogLevel
  module: string
  message: string
  data?: any
  error?: any
  context?: any
  timestamp: number
}

// In-memory log storage
const logEntries: LogEntry[] = []
let currentLogLevel = LogLevel.INFO
const MAX_LOG_ENTRIES = 1000

/**
 * Set the current log level
 */
export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level
  if (typeof window !== "undefined") {
    localStorage.setItem("log_level", level.toString())
  }
  console.log(`Log level set to ${LOG_LEVEL_NAMES[level]}`)
}

/**
 * Get all stored log entries
 */
export function getLogEntries(): LogEntry[] {
  return [...logEntries]
}

/**
 * Clear all stored log entries
 */
export function clearLogs(): void {
  logEntries.length = 0
  console.log("Logs cleared")
}

// Add a log entry to storage
function addLogEntry(entry: LogEntry): void {
  logEntries.push(entry)

  // Trim log if it gets too large
  if (logEntries.length > MAX_LOG_ENTRIES) {
    logEntries.shift()
  }
}

/**
 * Create a logger instance for a specific module
 */
export function createLogger(module: string) {
  return {
    error: (message: string, data?: any, error?: any, context?: any) => {
      if (currentLogLevel >= LogLevel.ERROR) {
        console.error(`[${module.toUpperCase()}] ERROR: ${message}`, data, error, context)
        addLogEntry({
          level: LogLevel.ERROR,
          module,
          message,
          data,
          error,
          context,
          timestamp: Date.now(),
        })
      }
    },
    warn: (message: string, data?: any, context?: any) => {
      if (currentLogLevel >= LogLevel.WARN) {
        console.warn(`[${module.toUpperCase()}] WARN: ${message}`, data, context)
        addLogEntry({
          level: LogLevel.WARN,
          module,
          message,
          data,
          context,
          timestamp: Date.now(),
        })
      }
    },
    info: (message: string, data?: any, context?: any) => {
      if (currentLogLevel >= LogLevel.INFO) {
        console.log(`[${module.toUpperCase()}] INFO: ${message}`, data, context)
        addLogEntry({
          level: LogLevel.INFO,
          module,
          message,
          data,
          context,
          timestamp: Date.now(),
        })
      }
    },
    debug: (message: string, data?: any, context?: any) => {
      if (currentLogLevel >= LogLevel.DEBUG) {
        console.debug(`[${module.toUpperCase()}] DEBUG: ${message}`, data, context)
        addLogEntry({
          level: LogLevel.DEBUG,
          module,
          message,
          data,
          context,
          timestamp: Date.now(),
        })
      }
    },
    trace: (message: string, data?: any, context?: any) => {
      if (currentLogLevel >= LogLevel.TRACE) {
        console.trace(`[${module.toUpperCase()}] TRACE: ${message}`, data, context)
        addLogEntry({
          level: LogLevel.TRACE,
          module,
          message,
          data,
          context,
          timestamp: Date.now(),
        })
      }
    },
    withContext: (context: Record<string, any>) => {
      return {
        error: (message: string, data?: any, error?: any) => {
          if (currentLogLevel >= LogLevel.ERROR) {
            console.error(`[${module.toUpperCase()}] ERROR: ${message}`, data, error, context)
            addLogEntry({
              level: LogLevel.ERROR,
              module,
              message,
              data,
              error,
              context,
              timestamp: Date.now(),
            })
          }
        },
        warn: (message: string, data?: any) => {
          if (currentLogLevel >= LogLevel.WARN) {
            console.warn(`[${module.toUpperCase()}] WARN: ${message}`, data, context)
            addLogEntry({
              level: LogLevel.WARN,
              module,
              message,
              data,
              context,
              timestamp: Date.now(),
            })
          }
        },
        info: (message: string, data?: any) => {
          if (currentLogLevel >= LogLevel.INFO) {
            console.log(`[${module.toUpperCase()}] INFO: ${message}`, data, context)
            addLogEntry({
              level: LogLevel.INFO,
              module,
              message,
              data,
              context,
              timestamp: Date.now(),
            })
          }
        },
        debug: (message: string, data?: any) => {
          if (currentLogLevel >= LogLevel.DEBUG) {
            console.debug(`[${module.toUpperCase()}] DEBUG: ${message}`, data, context)
            addLogEntry({
              level: LogLevel.DEBUG,
              module,
              message,
              data,
              context,
              timestamp: Date.now(),
            })
          }
        },
        trace: (message: string, data?: any) => {
          if (currentLogLevel >= LogLevel.TRACE) {
            console.trace(`[${module.toUpperCase()}] TRACE: ${message}`, data, context)
            addLogEntry({
              level: LogLevel.TRACE,
              module,
              message,
              data,
              context,
              timestamp: Date.now(),
            })
          }
        },
      }
    },
  }
}

// Export default logger for quick access
export default createLogger("App")
