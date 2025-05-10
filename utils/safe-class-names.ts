/**
 * Utility for safely handling class names with proper runtime guards
 */

import { safeWarn } from "./safe-console"

export function safeCn(...inputs: any[]): string {
  return inputs
    .filter((input) => {
      if (input === undefined || input === null || input === false) {
        return false
      }

      const type = typeof input
      if (type !== "string" && type !== "number") {
        if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
          safeWarn(`safeCn: ignored invalid input of type "${type}"`, input)
        }
        return false
      }

      return true
    })
    .join(" ")
}
