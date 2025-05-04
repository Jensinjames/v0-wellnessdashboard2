"use client"

import { useRef } from "react"

let globalId = 0

/**
 * React hook that returns a unique ID.
 * This hook can ONLY be used in client components.
 */
export function useUniqueId(prefix = "id"): string {
  const idRef = useRef<string | null>(null)

  if (idRef.current === null) {
    globalId++
    idRef.current = `${prefix}-${globalId}`
  }

  return idRef.current
}
