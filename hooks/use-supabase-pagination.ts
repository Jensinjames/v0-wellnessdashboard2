"use client"

import { useState, useEffect, useCallback } from "react"
import { useSupabase } from "./use-supabase"
import type { PostgrestFilterBuilder } from "@supabase/postgrest-js"
import type { Database } from "@/types/database"

type Table = keyof Database["public"]["Tables"]
type Row<T extends Table> = Database["public"]["Tables"][T]["Row"]

interface PaginationState<T> {
  data: T[]
  count: number | null
  isLoading: boolean
  error: Error | null
}

interface PaginationOptions {
  pageSize?: number
  initialPage?: number
  enabled?: boolean
}

/**
 * Hook for paginated queries
 */
export function useSupabasePagination<T extends Table>(
  table: T,
  filter?: (query: PostgrestFilterBuilder<any, any, any>) => PostgrestFilterBuilder<any, any, any>,
  options: PaginationOptions = {},
) {
  const supabase = useSupabase()
  const { pageSize = 10, initialPage = 1, enabled = true } = options
  const [page, setPage] = useState(initialPage)
  const [state, setState] = useState<PaginationState<Row<T>>>({
    data: [],
    count: null,
    isLoading: false,
    error: null,
  })

  const fetchData = useCallback(async () => {
    if (!enabled) return

    try {
      setState((prev) => ({ ...prev, isLoading: true }))

      // Calculate range for pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      // Build query
      let query = supabase.from(table).select("*", { count: "exact" }).range(from, to)

      if (filter) {
        query = filter(query)
      }

      const { data, error, count } = await query

      if (error) {
        throw error
      }

      setState({
        data: data as Row<T>[],
        count,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      console.error(`Error fetching paginated data for ${table}:`, error)
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }))
    }
  }, [supabase, table, filter, page, pageSize, enabled])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const totalPages = state.count !== null ? Math.ceil(state.count / pageSize) : 0

  return {
    ...state,
    page,
    pageSize,
    totalPages,
    setPage,
    nextPage: () => setPage((p) => (p < totalPages ? p + 1 : p)),
    prevPage: () => setPage((p) => (p > 1 ? p - 1 : p)),
    goToPage: (page: number) => setPage(Math.min(Math.max(1, page), totalPages)),
    refetch: fetchData,
  }
}
