/**
 * Logger utility for consistent logging across the application
 */

// Define log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export const LOG_LEVEL_NAMES = {
  [LogLevel.DEBUG]: "Debug",
  [LogLevel.INFO]: "Info",
  [LogLevel.WARN]: "Warning",
  [LogLevel.ERROR]: "Error",
}

// Define logger interface
export interface Logger {
  debug: (message: string, ...args: any[]) => void
  info: (message: string, ...args: any[]) => void
  warn: (message: string, ...args: any[]) => void
  error: (message: string, ...args: any[]) => void
}

// Define log entry interface
export interface LogEntry {
  timestamp: number
  level: LogLevel
  module: string
  message: string
  data?: any
  error?: any
  context?: any
}

// Current log level (can be changed at runtime)
let currentLogLevel: LogLevel = LogLevel.INFO

// In-memory log storage
const logEntries: LogEntry[] = []
const MAX_LOG_ENTRIES = 200

// Check if the current level allows the specified level
function shouldLog(level: LogLevel): boolean {
  return level >= currentLogLevel
}

// Format the log message with timestamp and module name
function formatLogMessage(module: string, level: string, message: string): string {
  const timestamp = new Date().toISOString()
  return `[${timestamp}] [${level}] [${module}] ${message}`
}

// Create a logger instance for a specific module
export function createLogger(module: string): Logger {
  return {
    debug: (message: string, data: any = {}, error?: any) => {
      if (shouldLog(LogLevel.DEBUG)) {
        log("DEBUG", module, message, data, error)
      }
    },
    info: (message: string, data: any = {}) => {
      if (shouldLog(LogLevel.INFO)) {
        log("INFO", module, message, data)
      }
    },
    warn: (message: string, data: any = {}) => {
      if (shouldLog(LogLevel.WARN)) {
        log("WARN", module, message, data)
      }
    },
    error: (message: string, data: any = {}, error?: any) => {
      if (shouldLog(LogLevel.ERROR)) {
        log("ERROR", module, message, data, error)
      }
    },
  }
}

// Internal log function
function log(level: string, module: string, message: string, data: any = {}, error?: any) {
  const timestamp = Date.now()
  const logEntry: LogEntry = {
    timestamp,
    level: LogLevel[level as keyof typeof LogLevel] as any,
    module,
    message,
    data,
    error,
  }

  // Add to log entries
  logEntries.unshift(logEntry)
  if (logEntries.length > MAX_LOG_ENTRIES) {
    logEntries.pop()
  }

  // Store in local storage
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("log_entries", JSON.stringify(logEntries))
    }
  } catch (e) {
    // If localStorage is full, clear older items
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      clearLogs()
      try {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("log_entries", JSON.stringify(logEntries))
        }
      } catch (retryError) {
        console.error("Error setting log item after clearing old logs:", retryError)
      }
    }
  }

  // Log to console
  console[level.toLowerCase()](formatLogMessage(module, level, message), data, error)
}

// Set the current log level
export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("log_level", level.toString())
    }
  } catch (e) {
    console.error("Error setting log level in localStorage:", e)
  }
  console.info(`Log level set to ${level}`)
}

// Get the current log level
export function getLogLevel(): LogLevel {
  return currentLogLevel
}

// Get all log entries
export function getLogEntries(): LogEntry[] {
  try {
    if (typeof localStorage !== "undefined") {
      const storedLogs = localStorage.getItem("log_entries")
      return storedLogs ? JSON.parse(storedLogs) : []
    }
    return logEntries
  } catch (e) {
    return logEntries
  }
}

// Clear all logs
export function clearLogs(): void {
  logEntries.length = 0
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("log_entries")
    }
  } catch (e) {
    console.error("Error clearing logs from localStorage:", e)
  }
  console.info("Logs cleared")
}

// Initialize log level from local storage
try {
  if (typeof localStorage !== "undefined") {
    const storedLevel = localStorage.getItem("log_level")
    if (storedLevel) {
      currentLogLevel = Number(storedLevel)
    }
  }
} catch (e) {
  // If the item isn't a valid cache item, skip it
}

// Export the logger instance
export const logger = createLogger("App")
