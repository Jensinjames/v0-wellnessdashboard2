/**
 * Logger utility for consistent logging across the application
 */

// Define log levels
export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  TRACE = 5,
}

export const LOG_LEVEL_NAMES = {
  [LogLevel.NONE]: "None",
  [LogLevel.ERROR]: "Error",
  [LogLevel.WARN]: "Warning",
  [LogLevel.INFO]: "Info",
  [LogLevel.DEBUG]: "Debug",
  [LogLevel.TRACE]: "Trace",
}

// Define logger interface
export interface Logger {
  debug: (message: string, ...args: any[]) => void
  info: (message: string, ...args: any[]) => void
  warn: (message: string, ...args: any[]) => void
  error: (message: string, ...args: any[]) => void
  trace: (message: string, ...args: any[]) => void
}

// Log entry interface
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

// Log storage
const logEntries: LogEntry[] = []
const MAX_LOG_ENTRIES = 1000

/**
 * Set the current log level
 */
export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level
  console.info(`Log level set to ${LOG_LEVEL_NAMES[level]}`)
}

/**
 * Get the current log level
 */
export function getLogLevel(): LogLevel {
  return currentLogLevel
}

// Check if the current level allows the specified level
function shouldLog(level: LogLevel): boolean {
  return level <= currentLogLevel
}

// Format the log message with timestamp and module name
function formatLogMessage(module: string, level: string, message: string): string {
  const timestamp = new Date().toISOString()
  return `[${timestamp}] [${level}] [${module}] ${message}`
}

// Create a logger instance for a specific module
export function createLogger(module: string): Logger {
  return {
    trace: (message: string, ...args: any[]) => {
      if (shouldLog(LogLevel.TRACE)) {
        const logEntry: LogEntry = {
          timestamp: Date.now(),
          level: LogLevel.TRACE,
          module,
          message,
          data: args.length > 0 ? args : undefined,
        }
        logEntries.push(logEntry)
        if (logEntries.length > MAX_LOG_ENTRIES) {
          logEntries.shift()
        }
        console.debug(formatLogMessage(module, "TRACE", message), ...args)
      }
    },
    debug: (message: string, ...args: any[]) => {
      if (shouldLog(LogLevel.DEBUG)) {
        const logEntry: LogEntry = {
          timestamp: Date.now(),
          level: LogLevel.DEBUG,
          module,
          message,
          data: args.length > 0 ? args : undefined,
        }
        logEntries.push(logEntry)
        if (logEntries.length > MAX_LOG_ENTRIES) {
          logEntries.shift()
        }
        console.debug(formatLogMessage(module, "DEBUG", message), ...args)
      }
    },
    info: (message: string, ...args: any[]) => {
      if (shouldLog(LogLevel.INFO)) {
        const logEntry: LogEntry = {
          timestamp: Date.now(),
          level: LogLevel.INFO,
          module,
          message,
          data: args.length > 0 ? args : undefined,
        }
        logEntries.push(logEntry)
        if (logEntries.length > MAX_LOG_ENTRIES) {
          logEntries.shift()
        }
        console.info(formatLogMessage(module, "INFO", message), ...args)
      }
    },
    warn: (message: string, ...args: any[]) => {
      if (shouldLog(LogLevel.WARN)) {
        const logEntry: LogEntry = {
          timestamp: Date.now(),
          level: LogLevel.WARN,
          module,
          message,
          data: args.length > 0 ? args : undefined,
        }
        logEntries.push(logEntry)
        if (logEntries.length > MAX_LOG_ENTRIES) {
          logEntries.shift()
        }
        console.warn(formatLogMessage(module, "WARN", message), ...args)
      }
    },
    error: (message: string, ...args: any[]) => {
      if (shouldLog(LogLevel.ERROR)) {
        const logEntry: LogEntry = {
          timestamp: Date.now(),
          level: LogLevel.ERROR,
          module,
          message,
          data: args.length > 0 ? args : undefined,
          error: args.length > 0 ? args[0] : undefined,
        }
        logEntries.push(logEntry)
        if (logEntries.length > MAX_LOG_ENTRIES) {
          logEntries.shift()
        }
        console.error(formatLogMessage(module, "ERROR", message), ...args)
      }
    },
  }
}

/**
 * Get all log entries
 */
export function getLogEntries(): LogEntry[] {
  return [...logEntries]
}

/**
 * Clear all log entries
 */
export function clearLogs(): void {
  logEntries.length = 0
}

// Export a default logger instance as a named export
export const logger = createLogger("App")
