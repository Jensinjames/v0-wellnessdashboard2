/**
 * Safe console utilities that only run when process exists
 */

export function safeWarn(message: string, ...args: any[]): void {
  if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
    console.warn(message, ...args)
  }
}

export function safeLog(message: string, ...args: any[]): void {
  if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
    console.log(message, ...args)
  }
}

export function safeError(message: string, ...args: any[]): void {
  if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
    console.error(message, ...args)
  }
}

/**
 * Safe development-only logging that only runs in development mode
 */
export function safeDevLog(message: string, ...args: any[]): void {
  if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
    console.log(`[DEV] ${message}`, ...args)
  }
}
