/**
 * Safe console utilities that don't reference process.env directly
 */
import { ENV, logger } from "./env-checker"

export function safeWarn(message: string, ...args: any[]): void {
  logger.warn(message, ...args)
}

export function safeLog(message: string, ...args: any[]): void {
  logger.log(message, ...args)
}

export function safeError(message: string, ...args: any[]): void {
  logger.error(message, ...args)
}

/**
 * Safe development-only logging
 */
export function safeDevLog(message: string, ...args: any[]): void {
  if (ENV.isDevelopment) {
    logger.log(`[DEV] ${message}`, ...args)
  }
}
