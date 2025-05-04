import { getSupabaseClient } from "@/lib/supabase"
import type { WeeklySummaryResponse, CategoryInsightResponse, EdgeFunctionError } from "@/types/edge-functions"

// Create a singleton instance of the Supabase client
const supabase = getSupabaseClient()

/**
 * Fetches weekly wellness summary with AI-generated insights
 */
export async function getWeeklyWellnessSummary(): Promise<WeeklySummaryResponse> {
  try {
    const { data, error } = await supabase.functions.invoke("weekly-wellness-summary", {
      method: "GET",
    })

    if (error) throw error

    return data as WeeklySummaryResponse
  } catch (error) {
    console.error("Error fetching weekly wellness summary:", error)
    return {
      data: [],
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Gets AI-generated insights for a specific wellness category
 */
export async function getCategoryInsights(category: string): Promise<CategoryInsightResponse> {
  try {
    const { data, error } = await supabase.functions.invoke("category-insights", {
      method: "POST",
      body: { category },
    })

    if (error) throw error

    return data as CategoryInsightResponse
  } catch (error) {
    console.error(`Error fetching insights for category ${category}:`, error)
    return {
      category,
      insights: "",
      recommendations: [],
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Handles errors from edge functions
 */
export function handleEdgeFunctionError(error: unknown): EdgeFunctionError {
  if (error instanceof Error) {
    return {
      error: error.message,
      status: 500,
      details: error.stack,
    }
  }

  return {
    error: "Unknown error occurred",
    status: 500,
  }
}
