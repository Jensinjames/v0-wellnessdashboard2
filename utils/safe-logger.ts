/**
 * Safe logger utility that only logs in development and when process exists
 */

export function safeDevLog(message: string, ...args: any[]): void {
  if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
    console.log(message, ...args)
  }
}

export function safeDevWarn(message: string, ...args: any[]): void {
  if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
    console.warn(message, ...args)
  }
}

export function safeDevError(message: string, ...args: any[]): void {
  if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
    console.error(message, ...args)
  }
}
