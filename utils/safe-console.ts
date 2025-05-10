/**
 * Safe console utilities that don't reference process.env directly
 */
import { ENV } from "@/lib/env-config"

export function safeWarn(message: string, ...args: any[]): void {
  if (!ENV.isProduction) {
    console.warn(message, ...args)
  }
}

export function safeLog(message: string, ...args: any[]): void {
  if (!ENV.isProduction) {
    console.log(message, ...args)
  }
}

export function safeError(message: string, ...args: any[]): void {
  if (!ENV.isProduction) {
    console.error(message, ...args)
  }
}

/**
 * Safe development-only logging
 */
export function safeDevLog(message: string, ...args: any[]): void {
  if (ENV.isDevelopment) {
    console.log(`[DEV] ${message}`, ...args)
  }
}
