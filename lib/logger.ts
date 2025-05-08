/**
 * Logger utility for consistent logging across the application
 */

// Define log levels
export type LogLevel = "debug" | "info" | "warn" | "error"

// Define logger interface
export interface Logger {
  debug: (message: string, ...args: any[]) => void
  info: (message: string, ...args: any[]) => void
  warn: (message: string, ...args: any[]) => void
  error: (message: string, ...args: any[]) => void
}

// Current log level (can be changed at runtime)
let currentLogLevel: LogLevel = "info"

// Map log levels to numeric values for comparison
const logLevelValue: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

// Check if the current level allows the specified level
function shouldLog(level: LogLevel): boolean {
  return logLevelValue[level] >= logLevelValue[currentLogLevel]
}

// Format the log message with timestamp and module name
function formatLogMessage(module: string, level: LogLevel, message: string): string {
  const timestamp = new Date().toISOString()
  return `[${timestamp}] [${level.toUpperCase()}] [${module}] ${message}`
}

// Create a logger instance for a specific module
export function createLogger(module: string): Logger {
  return {
    debug: (message: string, ...args: any[]) => {
      if (shouldLog("debug")) {
        console.debug(formatLogMessage(module, "debug", message), ...args)
      }
    },
    info: (message: string, ...args: any[]) => {
      if (shouldLog("info")) {
        console.info(formatLogMessage(module, "info", message), ...args)
      }
    },
    warn: (message: string, ...args: any[]) => {
      if (shouldLog("warn")) {
        console.warn(formatLogMessage(module, "warn", message), ...args)
      }
    },
    error: (message: string, ...args: any[]) => {
      if (shouldLog("error")) {
        console.error(formatLogMessage(module, "error", message), ...args)
      }
    },
  }
}

// Set the current log level
export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level
  console.info(`Log level set to ${level}`)
}

// Get the current log level
export function getLogLevel(): LogLevel {
  return currentLogLevel
}

// Create a default logger instance
export const logger = createLogger("App")
