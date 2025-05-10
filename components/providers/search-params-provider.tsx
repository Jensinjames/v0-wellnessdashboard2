"use client"

import { useSearchParams } from "next/navigation"
import { createContext, useContext, type ReactNode } from "react"

// Create context for search params
const SearchParamsContext = createContext<URLSearchParams | null>(null)

// Hook to safely use search params
export function useSafeSearchParams() {
  const params = useContext(SearchParamsContext)
  if (params === null) {
    throw new Error("useSafeSearchParams must be used within a SearchParamsProvider")
  }
  return params
}

// Provider component that captures search params
export function SearchParamsProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams()
  return <SearchParamsContext.Provider value={searchParams}>{children}</SearchParamsContext.Provider>
}
