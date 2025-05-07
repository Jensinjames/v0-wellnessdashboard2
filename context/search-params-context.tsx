"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useSearchParams as useNextSearchParams } from "next/navigation"

type SearchParamsContextType = {
  params: URLSearchParams | null
  getParam: (name: string) => string | null
  isReady: boolean
}

const SearchParamsContext = createContext<SearchParamsContextType>({
  params: null,
  getParam: () => null,
  isReady: false,
})

export function SearchParamsProvider({ children }: { children: ReactNode }) {
  const searchParams = useNextSearchParams()
  const [params, setParams] = useState<URLSearchParams | null>(null)

  useEffect(() => {
    // Only access searchParams after component has mounted
    setParams(searchParams)
  }, [searchParams])

  const getParam = (name: string): string | null => {
    return params ? params.get(name) : null
  }

  return (
    <SearchParamsContext.Provider value={{ params, getParam, isReady: params !== null }}>
      {children}
    </SearchParamsContext.Provider>
  )
}

export function useSearchParamsContext() {
  return useContext(SearchParamsContext)
}
