"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { getSupabase } from "@/lib/supabase-client"
import { createLogger } from "@/utils/logger"

const logger = createLogger("useBatchedSupabase")

// Types for batch operations
type BatchOperation = {
  id: string
  table: string
  operation: "select" | "insert" | "update" | "delete" | "upsert"
  query: any
  resolve: (value: any) => void
  reject: (reason: any) => void
  timestamp: number
}

// Configuration options
type BatchConfig = {
  batchTimeMs?: number
  maxBatchSize?: number
  enabled?: boolean
  debugMode?: boolean
}

// Default configuration
const DEFAULT_CONFIG: BatchConfig = {
  batchTimeMs: 50, // 50ms batching window
  maxBatchSize: 20, // Maximum 20 operations per batch
  enabled: true, // Batching enabled by default
  debugMode: false, // Debug logging disabled by default
}

/**
 * Custom hook for batched Supabase operations to reduce RLS calls
 */
export function useBatchedSupabase(config: BatchConfig = {}) {
  // Merge provided config with defaults
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  const { batchTimeMs, maxBatchSize, enabled, debugMode } = finalConfig

  // Queue for batched operations
  const operationsQueue = useRef<BatchOperation[]>([])

  // Batch processing state
  const [isProcessing, setIsProcessing] = useState(false)
  const [stats, setStats] = useState({
    totalOperations: 0,
    totalBatches: 0,
    operationsSaved: 0,
    lastBatchTime: 0,
  })

  // Timer reference
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Process the current batch of operations
  const processBatch = useCallback(async () => {
    if (operationsQueue.current.length === 0 || !enabled) return

    setIsProcessing(true)
    const startTime = performance.now()

    try {
      // Group operations by table and operation type
      const groupedOperations: Record<string, Record<string, BatchOperation[]>> = {}

      // Clone and clear the queue
      const currentBatch = [...operationsQueue.current]
      operationsQueue.current = []

      // Group operations
      currentBatch.forEach((op) => {
        if (!groupedOperations[op.table]) {
          groupedOperations[op.table] = {}
        }
        if (!groupedOperations[op.table][op.operation]) {
          groupedOperations[op.table][op.operation] = []
        }
        groupedOperations[op.table][op.operation].push(op)
      })

      // Process each group
      const supabase = getSupabase()
      if (!supabase) {
        throw new Error("Supabase client not initialized")
      }

      // Process each table and operation type
      for (const table of Object.keys(groupedOperations)) {
        for (const opType of Object.keys(groupedOperations[table])) {
          const operations = groupedOperations[table][opType]

          if (opType === "select") {
            // For selects, we can optimize by combining filters where possible
            // This is a simplified implementation - in a real app, you'd need more sophisticated query merging
            await processSelectOperations(supabase, table, operations)
          } else {
            // For other operations, process individually for now
            // In a real app, you could batch inserts/updates/deletes as well
            for (const op of operations) {
              try {
                let result
                switch (op.operation) {
                  case "insert":
                    result = await supabase.from(table).insert(op.query.values).select()
                    break
                  case "update":
                    result = await supabase.from(table).update(op.query.values).match(op.query.match).select()
                    break
                  case "upsert":
                    result = await supabase.from(table).upsert(op.query.values).select()
                    break
                  case "delete":
                    result = await supabase.from(table).delete().match(op.query.match)
                    break
                  default:
                    throw new Error(`Unsupported operation: ${op.operation}`)
                }
                op.resolve(result)
              } catch (error) {
                op.reject(error)
              }
            }
          }
        }
      }

      // Update stats
      const operationsSaved = currentBatch.length - Object.keys(groupedOperations).length
      setStats((prev) => ({
        totalOperations: prev.totalOperations + currentBatch.length,
        totalBatches: prev.totalBatches + 1,
        operationsSaved: prev.operationsSaved + operationsSaved,
        lastBatchTime: performance.now() - startTime,
      }))

      if (debugMode) {
        logger.info(`Processed batch of ${currentBatch.length} operations, saved ${operationsSaved} RLS calls`)
      }
    } catch (error) {
      logger.error("Error processing batch:", error)

      // Reject all operations in the batch
      operationsQueue.current.forEach((op) => {
        op.reject(error)
      })
      operationsQueue.current = []
    } finally {
      setIsProcessing(false)
    }
  }, [enabled, debugMode])

  // Process select operations by combining similar queries where possible
  const processSelectOperations = async (supabase: any, table: string, operations: BatchOperation[]) => {
    // Group by similar query patterns
    // This is a simplified implementation - in a real app, you'd need more sophisticated query analysis
    const simpleQueries = operations.filter((op) => !op.query.filters || Object.keys(op.query.filters).length === 0)
    const filteredQueries = operations.filter((op) => op.query.filters && Object.keys(op.query.filters).length > 0)

    // Process simple queries (no filters) as a single query if possible
    if (simpleQueries.length > 0) {
      try {
        // Find the most common columns requested
        const columnsMap: Record<string, number> = {}
        simpleQueries.forEach((op) => {
          if (op.query.columns) {
            op.query.columns.forEach((col: string) => {
              columnsMap[col] = (columnsMap[col] || 0) + 1
            })
          }
        })

        // Get all columns that are requested by any query
        const allColumns = Object.keys(columnsMap)

        // Execute a single query to get all needed data
        const { data, error } = await supabase
          .from(table)
          .select(allColumns.join(","))
          .limit(Math.max(...simpleQueries.map((op) => op.query.limit || 100)))

        if (error) throw error

        // Resolve each operation with its specific data
        simpleQueries.forEach((op) => {
          if (op.query.columns) {
            // Filter the data to only include requested columns
            const filteredData = data.map((item: any) => {
              const result: Record<string, any> = {}
              op.query.columns.forEach((col: string) => {
                result[col] = item[col]
              })
              return result
            })

            // Apply any limit
            const limitedData = op.query.limit ? filteredData.slice(0, op.query.limit) : filteredData

            op.resolve({ data: limitedData, error: null })
          } else {
            // If no specific columns were requested, return all data
            const limitedData = op.query.limit ? data.slice(0, op.query.limit) : data
            op.resolve({ data: limitedData, error: null })
          }
        })
      } catch (error) {
        // If the combined query fails, fall back to individual queries
        for (const op of simpleQueries) {
          try {
            let query = supabase.from(table).select(op.query.columns?.join(",") || "*")

            if (op.query.limit) {
              query = query.limit(op.query.limit)
            }

            const result = await query
            op.resolve(result)
          } catch (err) {
            op.reject(err)
          }
        }
      }
    }

    // Process filtered queries individually for now
    // In a real app, you could implement more sophisticated query merging
    for (const op of filteredQueries) {
      try {
        let query = supabase.from(table).select(op.query.columns?.join(",") || "*")

        // Apply filters
        if (op.query.filters) {
          Object.entries(op.query.filters).forEach(([key, value]) => {
            if (value === null) {
              query = query.is(key, null)
            } else if (Array.isArray(value)) {
              query = query.in(key, value)
            } else if (typeof value === "object") {
              // Handle range queries, etc.
              if ("gt" in value) query = query.gt(key, value.gt)
              if ("gte" in value) query = query.gte(key, value.gte)
              if ("lt" in value) query = query.lt(key, value.lt)
              if ("lte" in value) query = query.lte(key, value.lte)
              if ("neq" in value) query = query.neq(key, value.neq)
            } else {
              query = query.eq(key, value)
            }
          })
        }

        // Apply limit
        if (op.query.limit) {
          query = query.limit(op.query.limit)
        }

        // Apply order
        if (op.query.order) {
          query = query.order(op.query.order.column, { ascending: op.query.order.ascending })
        }

        const result = await query
        op.resolve(result)
      } catch (error) {
        op.reject(error)
      }
    }
  }

  // Schedule batch processing
  const scheduleBatchProcessing = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      processBatch()
      timerRef.current = null
    }, batchTimeMs)
  }, [batchTimeMs, processBatch])

  // Add an operation to the queue
  const queueOperation = useCallback(
    (table: string, operation: BatchOperation["operation"], query: any): Promise<any> => {
      return new Promise((resolve, reject) => {
        // If batching is disabled, execute immediately
        if (!enabled) {
          const supabase = getSupabase()
          if (!supabase) {
            reject(new Error("Supabase client not initialized"))
            return
          }

          let supabaseQuery

          switch (operation) {
            case "select":
              supabaseQuery = supabase.from(table).select(query.columns?.join(",") || "*")

              // Apply filters
              if (query.filters) {
                Object.entries(query.filters).forEach(([key, value]) => {
                  if (value === null) {
                    supabaseQuery = supabaseQuery.is(key, null)
                  } else if (Array.isArray(value)) {
                    supabaseQuery = supabaseQuery.in(key, value)
                  } else if (typeof value === "object") {
                    // Handle range queries, etc.
                    if ("gt" in value) supabaseQuery = supabaseQuery.gt(key, value.gt)
                    if ("gte" in value) supabaseQuery = supabaseQuery.gte(key, value.gte)
                    if ("lt" in value) supabaseQuery = supabaseQuery.lt(key, value.lt)
                    if ("lte" in value) supabaseQuery = supabaseQuery.lte(key, value.lte)
                    if ("neq" in value) supabaseQuery = supabaseQuery.neq(key, value.neq)
                  } else {
                    supabaseQuery = supabaseQuery.eq(key, value)
                  }
                })
              }

              // Apply limit
              if (query.limit) {
                supabaseQuery = supabaseQuery.limit(query.limit)
              }

              // Apply order
              if (query.order) {
                supabaseQuery = supabaseQuery.order(query.order.column, { ascending: query.order.ascending })
              }

              supabaseQuery.then(resolve).catch(reject)
              break

            case "insert":
              supabase.from(table).insert(query.values).select().then(resolve).catch(reject)
              break

            case "update":
              supabase.from(table).update(query.values).match(query.match).select().then(resolve).catch(reject)
              break

            case "upsert":
              supabase.from(table).upsert(query.values).select().then(resolve).catch(reject)
              break

            case "delete":
              supabase.from(table).delete().match(query.match).then(resolve).catch(reject)
              break

            default:
              reject(new Error(`Unsupported operation: ${operation}`))
          }

          return
        }

        // Add to queue
        const newOperation: BatchOperation = {
          id: Math.random().toString(36).substring(2, 9),
          table,
          operation,
          query,
          resolve,
          reject,
          timestamp: Date.now(),
        }

        operationsQueue.current.push(newOperation)

        // If we've reached max batch size, process immediately
        if (operationsQueue.current.length >= maxBatchSize) {
          processBatch()
        } else {
          // Otherwise schedule processing
          scheduleBatchProcessing()
        }
      })
    },
    [enabled, maxBatchSize, processBatch, scheduleBatchProcessing],
  )

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  // Convenience methods for different operations
  const select = useCallback(
    (
      table: string,
      options: {
        columns?: string[]
        filters?: Record<string, any>
        limit?: number
        order?: { column: string; ascending: boolean }
      } = {},
    ) => {
      return queueOperation(table, "select", options)
    },
    [queueOperation],
  )

  const insert = useCallback(
    (table: string, values: Record<string, any> | Record<string, any>[]) => {
      return queueOperation(table, "insert", { values })
    },
    [queueOperation],
  )

  const update = useCallback(
    (table: string, values: Record<string, any>, match: Record<string, any>) => {
      return queueOperation(table, "update", { values, match })
    },
    [queueOperation],
  )

  const upsert = useCallback(
    (table: string, values: Record<string, any> | Record<string, any>[]) => {
      return queueOperation(table, "upsert", { values })
    },
    [queueOperation],
  )

  const remove = useCallback(
    (table: string, match: Record<string, any>) => {
      return queueOperation(table, "delete", { match })
    },
    [queueOperation],
  )

  // Force process the current batch
  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    return processBatch()
  }, [processBatch])

  return {
    select,
    insert,
    update,
    upsert,
    delete: remove, // 'delete' is a reserved word
    flush,
    stats,
    isProcessing,
    queueLength: operationsQueue.current.length,
  }
}
