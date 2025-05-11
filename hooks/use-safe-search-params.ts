"use client"

import { useState, useEffect } from "react"
import { useSearchParams as useNextSearchParams } from "next/navigation"

/**
 * A hook that safely accesses search parameters after component mount
 * to avoid CSR bailout issues with useSearchParams()
 *
 * @returns An object containing the search params and a helper to get specific params
 */
export function useSafeSearchParams() {
  const searchParams = useNextSearchParams()
  const [params, setParams] = useState<URLSearchParams | null>(null)

  useEffect(() => {
    // Only access searchParams after component has mounted
    setParams(searchParams)
  }, [searchParams])

  const getParam = (name: string): string | null => {
    return params ? params.get(name) : null
  }

  return {
    params,
    getParam,
    isReady: params !== null,
  }
}
