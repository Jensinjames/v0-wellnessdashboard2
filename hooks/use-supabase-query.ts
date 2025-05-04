"use client"

import { useState, useEffect, useCallback } from "react"
import { useSupabase } from "./use-supabase"
import type { PostgrestFilterBuilder } from "@supabase/postgrest-js"
import type { Database } from "@/types/database"

type Table = keyof Database["public"]["Tables"]
type Row<T extends Table> = Database["public"]["Tables"][T]["Row"]
type InsertRow<T extends Table> = Database["public"]["Tables"][T]["Insert"]
type UpdateRow<T extends Table> = Database["public"]["Tables"][T]["Update"]

interface QueryState<T> {
  data: T | null
  isLoading: boolean
  error: Error | null
}

interface QueryOptions {
  enabled?: boolean
}

/**
 * Hook to fetch a single row by ID
 */
export function useSupabaseRow<T extends Table>(
  table: T,
  id: string | null,
  options: QueryOptions = {},
): QueryState<Row<T>> & { refetch: () => Promise<void> } {
  const supabase = useSupabase()
  const [state, setState] = useState<QueryState<Row<T>>>({
    data: null,
    isLoading: false,
    error: null,
  })
  const { enabled = true } = options

  const fetchData = useCallback(async () => {
    if (!id || !enabled) return

    try {
      setState((prev) => ({ ...prev, isLoading: true }))

      const { data, error } = await supabase.from(table).select("*").eq("id", id).single()

      if (error) {
        throw error
      }

      setState({
        data: data as Row<T>,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      console.error(`Error fetching ${table} with ID ${id}:`, error)
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }))
    }
  }, [supabase, table, id, enabled])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    ...state,
    refetch: fetchData,
  }
}

/**
 * Hook to fetch multiple rows with optional filters
 */
export function useSupabaseQuery<T extends Table>(
  table: T,
  filter?: (query: PostgrestFilterBuilder<any, any, any>) => PostgrestFilterBuilder<any, any, any>,
  options: QueryOptions = {},
): QueryState<Row<T>[]> & { refetch: () => Promise<void> } {
  const supabase = useSupabase()
  const [state, setState] = useState<QueryState<Row<T>[]>>({
    data: null,
    isLoading: false,
    error: null,
  })
  const { enabled = true } = options

  const fetchData = useCallback(async () => {
    if (!enabled) return

    try {
      setState((prev) => ({ ...prev, isLoading: true }))

      let query = supabase.from(table).select("*")

      if (filter) {
        query = filter(query)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      setState({
        data: data as Row<T>[],
        isLoading: false,
        error: null,
      })
    } catch (error) {
      console.error(`Error fetching ${table}:`, error)
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }))
    }
  }, [supabase, table, filter, enabled])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    ...state,
    refetch: fetchData,
  }
}

/**
 * Hook to create a mutation function for inserting a row
 */
export function useSupabaseInsert<T extends Table>(table: T) {
  const supabase = useSupabase()
  const [state, setState] = useState<{
    isLoading: boolean
    error: Error | null
    data: Row<T> | null
  }>({
    isLoading: false,
    error: null,
    data: null,
  })

  const insert = async (data: InsertRow<T>) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }))

      const { data: result, error } = await supabase.from(table).insert(data).select().single()

      if (error) {
        throw error
      }

      setState({
        isLoading: false,
        error: null,
        data: result as Row<T>,
      })

      return { data: result as Row<T>, error: null }
    } catch (error) {
      console.error(`Error inserting into ${table}:`, error)
      setState({
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error)),
        data: null,
      })

      return {
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
      }
    }
  }

  return {
    insert,
    ...state,
  }
}

/**
 * Hook to create a mutation function for updating a row
 */
export function useSupabaseUpdate<T extends Table>(table: T) {
  const supabase = useSupabase()
  const [state, setState] = useState<{
    isLoading: boolean
    error: Error | null
    data: Row<T> | null
  }>({
    isLoading: false,
    error: null,
    data: null,
  })

  const update = async (id: string, data: UpdateRow<T>) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }))

      const { data: result, error } = await supabase.from(table).update(data).eq("id", id).select().single()

      if (error) {
        throw error
      }

      setState({
        isLoading: false,
        error: null,
        data: result as Row<T>,
      })

      return { data: result as Row<T>, error: null }
    } catch (error) {
      console.error(`Error updating ${table} with ID ${id}:`, error)
      setState({
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error)),
        data: null,
      })

      return {
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
      }
    }
  }

  return {
    update,
    ...state,
  }
}

/**
 * Hook to create a mutation function for deleting a row
 */
export function useSupabaseDelete<T extends Table>(table: T) {
  const supabase = useSupabase()
  const [state, setState] = useState<{
    isLoading: boolean
    error: Error | null
    success: boolean
  }>({
    isLoading: false,
    error: null,
    success: false,
  })

  const remove = async (id: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }))

      const { error } = await supabase.from(table).delete().eq("id", id)

      if (error) {
        throw error
      }

      setState({
        isLoading: false,
        error: null,
        success: true,
      })

      return { success: true, error: null }
    } catch (error) {
      console.error(`Error deleting from ${table} with ID ${id}:`, error)
      setState({
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error)),
        success: false,
      })

      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }
    }
  }

  return {
    remove,
    ...state,
  }
}
