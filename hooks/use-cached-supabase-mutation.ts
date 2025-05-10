"use client"

/**
 * Custom hook for cached Supabase mutations
 * Provides automatic cache invalidation and optimistic updates
 */
import { useState, useCallback } from "react"
import { getSupabaseClient } from "@/utils/supabase-client"
import { getEnhancedQueryCache } from "@/lib/enhanced-query-cache"

type MutationOptions<TData, TVariables> = {
  // Cache options
  invalidateTags?: string[] // Tags to invalidate after mutation
  invalidateQueries?: string[] // Query keys to invalidate after mutation

  // Optimistic updates
  optimisticUpdate?: (variables: TVariables) => TData // Function to generate optimistic data
  rollbackOnError?: boolean // Whether to rollback optimistic updates on error

  // Callbacks
  onMutate?: (variables: TVariables) => Promise<unknown> | unknown
  onSuccess?: (data: TData, variables: TVariables, context: unknown) => Promise<unknown> | unknown
  onError?: (error: Error, variables: TVariables, context: unknown) => Promise<unknown> | unknown
  onSettled?: (
    data: TData | null,
    error: Error | null,
    variables: TVariables,
    context: unknown,
  ) => Promise<unknown> | unknown
}

type MutationResult<TData, TVariables> = {
  mutate: (variables: TVariables) => Promise<TData>
  data: TData | null
  error: Error | null
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  reset: () => void
}

/**
 * Hook for cached Supabase mutations (insert, update, delete)
 * @param table Table name
 * @param type Mutation type
 * @param options Mutation options
 * @returns Mutation result
 */
export function useCachedSupabaseMutation<TData = any, TVariables = any>(
  table: string,
  type: "insert" | "update" | "delete",
  options: MutationOptions<TData, TVariables> = {},
): MutationResult<TData, TVariables> {
  const supabase = getSupabaseClient()
  const cache = getEnhancedQueryCache()

  // Default options
  const {
    invalidateTags = [table],
    invalidateQueries = [],
    optimisticUpdate,
    rollbackOnError = true,
    onMutate,
    onSuccess,
    onError,
    onSettled,
  } = options

  // State
  const [data, setData] = useState<TData | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Mutation function
  const mutate = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setIsLoading(true)
      setError(null)

      let context: unknown = undefined
      let optimisticData: TData | undefined = undefined

      try {
        // Call onMutate callback
        if (onMutate) {
          context = await onMutate(variables)
        }

        // Apply optimistic update if provided
        if (optimisticUpdate) {
          optimisticData = optimisticUpdate(variables)
          setData(optimisticData)
        }

        // Execute the mutation
        let result

        if (type === "insert") {
          const { data: insertData, error: insertError } = await supabase
            .from(table)
            .insert(variables as any)
            .select()

          if (insertError) throw new Error(`Supabase error: ${insertError.message}`)
          result = insertData
        } else if (type === "update") {
          const { filter, ...updateData } = variables as any

          let query = supabase.from(table).update(updateData)

          // Apply filters
          if (filter) {
            Object.entries(filter).forEach(([key, value]) => {
              if (value === null) {
                query = query.is(key, null)
              } else if (Array.isArray(value)) {
                query = query.in(key, value)
              } else {
                query = query.eq(key, value)
              }
            })
          }

          const { data: updateResult, error: updateError } = await query.select()

          if (updateError) throw new Error(`Supabase error: ${updateError.message}`)
          result = updateResult
        } else if (type === "delete") {
          const filter = variables as any

          let query = supabase.from(table).delete()

          // Apply filters
          if (filter) {
            Object.entries(filter).forEach(([key, value]) => {
              if (value === null) {
                query = query.is(key, null)
              } else if (Array.isArray(value)) {
                query = query.in(key, value)
              } else {
                query = query.eq(key, value)
              }
            })
          }

          const { data: deleteData, error: deleteError } = await query.select()

          if (deleteError) throw new Error(`Supabase error: ${deleteError.message}`)
          result = deleteData
        } else {
          throw new Error(`Invalid mutation type: ${type}`)
        }

        // Invalidate cache
        if (invalidateTags.length > 0) {
          cache.invalidateByTags(invalidateTags)
        }

        if (invalidateQueries.length > 0) {
          invalidateQueries.forEach((queryKey) => {
            cache.delete(queryKey)
          })
        }

        // Update state
        setData(result as TData)
        setIsLoading(false)

        // Call onSuccess callback
        if (onSuccess) {
          await onSuccess(result as TData, variables, context)
        }

        // Call onSettled callback
        if (onSettled) {
          await onSettled(result as TData, null, variables, context)
        }

        return result as TData
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))

        // Rollback optimistic update if needed
        if (optimisticUpdate && rollbackOnError) {
          setData(null)
        }

        // Update state
        setError(error)
        setIsLoading(false)

        // Call onError callback
        if (onError) {
          await onError(error, variables, context)
        }

        // Call onSettled callback
        if (onSettled) {
          await onSettled(null, error, variables, context)
        }

        throw error
      }
    },
    [
      table,
      type,
      invalidateTags,
      invalidateQueries,
      optimisticUpdate,
      rollbackOnError,
      onMutate,
      onSuccess,
      onError,
      onSettled,
    ],
  )

  // Reset function
  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setIsLoading(false)
  }, [])

  return {
    mutate,
    data,
    error,
    isLoading,
    isError: !!error,
    isSuccess: !!data && !error,
    reset,
  }
}
