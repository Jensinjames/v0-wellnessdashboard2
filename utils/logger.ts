/**
 * Simple logger utility
 */

type LogLevel = "debug" | "info" | "warn" | "error"

interface LoggerOptions {
  prefix?: string
  enabled?: boolean
}

export function createLogger(name: string, options: LoggerOptions = {}) {
  const { prefix = "", enabled = true } = options
  const logPrefix = prefix ? `${prefix}:${name}` : name

  function formatMessage(message: string, data?: any, context?: any): string {
    let formattedMessage = `[${logPrefix}] ${message}`

    if (data) {
      try {
        formattedMessage += ` ${JSON.stringify(data)}`
      } catch (e) {
        formattedMessage += " [Data cannot be stringified]"
      }
    }

    if (context) {
      try {
        formattedMessage += ` (Context: ${JSON.stringify(context)})`
      } catch (e) {
        formattedMessage += " [Context cannot be stringified]"
      }
    }

    return formattedMessage
  }

  return {
    debug(message: string, data?: any, context?: any) {
      if (!enabled) return
      console.debug(formatMessage(message, data, context))
    },

    info(message: string, data?: any, context?: any) {
      if (!enabled) return
      console.info(formatMessage(message, data, context))
    },

    warn(message: string, data?: any, context?: any) {
      if (!enabled) return
      console.warn(formatMessage(message, data, context))
    },

    error(message: string, data?: any, error?: any, context?: any) {
      if (!enabled) return
      console.error(formatMessage(message, data, context), error || "")
    },
  }
}
