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

// Get current log level from environment or default to INFO
const getCurrentLogLevel = (): LogLevel => {
  const envLevel =
    typeof window !== "undefined" ? window.localStorage.getItem("log_level") : process.env.NEXT_PUBLIC_DEBUG_LEVEL

  switch (envLevel) {
    case "debug":
      return LogLevel.DEBUG
    case "info":
      return LogLevel.INFO
    case "warn":
      return LogLevel.WARN
    case "error":
      return LogLevel.ERROR
    default:
      return LogLevel.INFO
  }
}

// Create a logger instance for a specific module
export function createLogger(module: string): Logger {
  return {
    debug: (message: string, ...args: any[]) => {
      if (getCurrentLogLevel() <= LogLevel.DEBUG) {
        console.debug(`[DEBUG] [${module}] ${message}`, ...args)
      }
    },
    info: (message: string, ...args: any[]) => {
      if (getCurrentLogLevel() <= LogLevel.INFO) {
        console.info(`[INFO] [${module}] ${message}`, ...args)
      }
    },
    warn: (message: string, ...args: any[]) => {
      if (getCurrentLogLevel() <= LogLevel.WARN) {
        console.warn(`[WARN] [${module}] ${message}`, ...args)
      }
    },
    error: (message: string, ...args: any[]) => {
      if (getCurrentLogLevel() <= LogLevel.ERROR) {
        console.error(`[ERROR] [${module}] ${message}`, ...args)
      }
    },
  }
}

// Export a default logger instance
export const logger = createLogger("App")
