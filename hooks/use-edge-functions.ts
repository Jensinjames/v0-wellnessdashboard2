"use client"

import { useState, useEffect } from "react"
import { getWeeklyWellnessSummary, getCategoryInsights } from "@/services/edge-functions-service"
import type { WeeklySummaryResponse, CategoryInsightResponse } from "@/types/edge-functions"

export function useWeeklyWellnessSummary() {
  const [data, setData] = useState<WeeklySummaryResponse["data"]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const response = await getWeeklyWellnessSummary()

        if (response.error) {
          setError(response.error)
        } else {
          setData(response.data)
          setError(null)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { data, error, loading }
}

export function useCategoryInsights(category: string) {
  const [data, setData] = useState<CategoryInsightResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    async function fetchData() {
      if (!category) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await getCategoryInsights(category)

        if (response.error) {
          setError(response.error)
        } else {
          setData(response)
          setError(null)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [category])

  return { data, error, loading }
}
