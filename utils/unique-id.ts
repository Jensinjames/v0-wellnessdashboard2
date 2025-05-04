"use client"
import { useRef } from "react"

// A map to track used IDs and prevent duplicates
const usedIds = new Map<string, number>()

/**
 * Generates a unique ID for accessibility purposes
 *
 * @param baseId - The base ID to use
 * @returns A unique ID based on the baseId
 */
export function generateUniqueId(baseId: string): string {
  // Sanitize the baseId to ensure it's a valid HTML ID
  const sanitizedId = baseId.replace(/[^a-zA-Z0-9-_]/g, "-").toLowerCase()

  // Get the current count for this baseId
  const count = usedIds.get(sanitizedId) || 0

  // Increment the count
  usedIds.set(sanitizedId, count + 1)

  // If this is the first use, return the baseId as is
  if (count === 0) {
    return sanitizedId
  }

  // Otherwise, append the count to make it unique
  return `${sanitizedId}-${count}`
}

let globalId = 0

export function useUniqueId(prefix = "id"): string {
  const idRef = useRef<string | null>(null)

  if (idRef.current === null) {
    globalId++
    idRef.current = `${prefix}-${globalId}`
  }

  return idRef.current
}

/**
 * Resets the ID tracking (useful for testing)
 */
export function resetUniqueIds(): void {
  usedIds.clear()
}
